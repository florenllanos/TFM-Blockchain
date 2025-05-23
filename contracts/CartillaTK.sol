// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

//import "@openzeppelin/contracts/utils/Counters.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "./VacunaTK.sol";

import {IERC998ERC721TopDown} from "./interfaces/IERC998ERC721TopDown.sol";

contract CartillaTK is ERC721, IERC998ERC721TopDown {
    // Estructura dades cartilla.
    struct Cartilla {
        uint256 idToken;        
        string hashCip;
        bool permisAdministrar;
    }

    // Pacient --> cartilla. A partir de l'adreça de un pacient mapegem la seva cartilla.
    mapping(address => Cartilla) private cartillaPacient;

    // Mapping de lots a partir del id del Token ERC721, podem obtenir la informació de la cartilla.
    mapping(uint256 => Cartilla) private cartilles;

    // Estructura dades vacuna dintre de la cartilla. Vacunes administrades.
    struct DadesVacunaCartilla {
        address contracteVacuna;
        uint256 idVacunaToken;
        VacunaTK.Vacuna vacuna;
    }

    // Quantitat de vacunes que té per cartilla (idParentToken => num vacunes).
    mapping(uint256 => uint256) private numVacunesCartilla;

    // Contador automàtic per evitar repeticions en el tokenId.
    uint256 tokenId = 1;

    bytes32 public constant ERC998_MAGIC_VALUE = 0xcd740db500000000000000000000000000000000000000000000000000000000;
    //from zepellin ERC721Receiver.sol
    //old version
    bytes4 constant ERC721_RECEIVED_OLD = 0xf0b9e5ba;
    //new version
    bytes4 constant ERC721_RECEIVED_NEW = 0x150b7a02;

    address owner;

    /* Adreça del contracte del que podem rebre fills. Per el cas dels lots i vacunes, nomér permetem que rebre fills de un
    mateix contracte. Per el primer fill guardem la adreça del contracte del que prové i ens cas que al rebre un altre fill
    intentem que vingui d'un altre contracte no deixem fer-ho */
    address childContract;

    // Mapings
    // Guardem l'adreça del propietari del token ERC998.
    mapping(uint256 => address) internal tokenIdToTokenOwner;

    /* tokenId => (child address => array of child tokens). A partir de un id de pare i del contracte dels fills, 
    guardem el llistat de Id de fills */
    mapping(uint256 => mapping(address => uint256[])) private childTokens;

    // tokenId => (child contract address => (child id => child index+1). Número de fills que te un pare.
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) private childTokenIndex;

    /* child address => childId => tokenId. A partir del contracte de un fill, i del seu id fill, podem veure quin es el seu pare. 
    En el nostre cas, a partir de un contracte que genera vacunes i del id de una de les vacunes generades, podem trobar el pare/lot. */
    mapping(address => mapping(uint256 => uint256)) internal childTokenOwner;

    // tokenId => child contract
    mapping(uint256 => address[]) private childContracts;

    // tokenId => (child address => contract index+1)
    mapping(uint256 => mapping(address => uint256)) private childContractIndex;

    // token owner => (operator address => bool)
    mapping(address => mapping(address => bool)) internal tokenOwnerToOperators;

    // root token owner address => (tokenId => approved address)
    mapping(address => mapping(uint256 => address)) internal rootOwnerAndTokenIdToApprovedAddress;

    // token owner address => token count
    mapping(address => uint256) internal tokenOwnerToTokenCount;

    constructor() ERC721("CartillaTK", "CRTTK") {}

    function mint(address to,  string memory _hashCip) public {
        Cartilla memory newCartilla = Cartilla({
            idToken: tokenId,
            hashCip: _hashCip,
            permisAdministrar: false
        });
        safeMint(to, newCartilla);
        tokenId++;
    }
   
    function safeMint(address to, Cartilla memory _newCartilla) public  {
        cartilles[_newCartilla.idToken] = _newCartilla;                 
        tokenIdToTokenOwner[_newCartilla.idToken] = to;
        tokenOwnerToTokenCount[to]++;
        cartillaPacient[to] = _newCartilla;  
        _safeMint(to, _newCartilla.idToken);
    }



    function isContract(address _addr) internal view returns (bool) {
        uint256 size;
        assembly {size := extcodesize(_addr)}
        return size > 0;
    }

    ///////// Implementació interficie ERC998ERC721TopDown ////////
    // Basada en la implementació de referència de: https://github.com/mattlockyer/composables-998
    //// WIP /////

    function _transferFrom(address _from, address _to, uint256 _tokenId) private {       
        require(_from != address(0));
        require(tokenIdToTokenOwner[_tokenId] == _from);
        require(_to != address(0));

        if(msg.sender != _from) {
            (bool callSuccess, bytes memory data) = _from.staticcall(abi.encodeWithSelector(0xed81cdda, address(this), _tokenId));
            bytes32 rootOwner = abi.decode(data, (bytes32));
            if(callSuccess == true) {
                require(rootOwner >> 224 != ERC998_MAGIC_VALUE, "Cartilla Token is child of other top down composable");
            }
            require(tokenOwnerToOperators[_from][msg.sender] ||
            rootOwnerAndTokenIdToApprovedAddress[_from][_tokenId] == msg.sender);
        }

        // clear approval
        if (rootOwnerAndTokenIdToApprovedAddress[_from][_tokenId] != address(0)) {
            delete rootOwnerAndTokenIdToApprovedAddress[_from][_tokenId];
            emit Approval(_from, address(0), _tokenId);
        }

        // remove and transfer token
        if (_from != _to) {
            assert(tokenOwnerToTokenCount[_from] > 0);
            tokenOwnerToTokenCount[_from]--;
            tokenIdToTokenOwner[_tokenId] = _to;
            tokenOwnerToTokenCount[_to]++;
        }
        emit Transfer(_from, _to, _tokenId);
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public virtual override {
        _transferFrom(_from, _to, _tokenId);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory data) public virtual override {
        _transferFrom(_from, _to, _tokenId);
        if (isContract(_to)) {
            bytes4 retval = IERC721Receiver(_to).onERC721Received(msg.sender, _from, _tokenId, "");
            require(retval == ERC721_RECEIVED_OLD);
        }
    }

    function rootOwnerOf(uint256 _tokenId) public override view returns (bytes32 rootOwner) {
        return rootOwnerOfChild(address(0), _tokenId);        
    }

    function rootOwnerOfChild(address _childContract, uint256 _childTokenId) public override view returns (bytes32 rootOwner) {
        address rootOwnerAddress;
        if (_childContract != address(0)) {
            (rootOwnerAddress, _childTokenId) = _ownerOfChild(_childContract, _childTokenId);
        }
        else {
            rootOwnerAddress = tokenIdToTokenOwner[_childTokenId];
        }
        // Case 1: Token owner is this contract and token.
        while (rootOwnerAddress == address(this)) {
            (rootOwnerAddress, _childTokenId) = _ownerOfChild(rootOwnerAddress, _childTokenId);
        }
        // 0xed81cdda == rootOwnerOfChild(address,uint256)
        (bool callSuccess, bytes memory data) = rootOwnerAddress.staticcall(abi.encodeWithSelector(0xed81cdda, address(this), _childTokenId));
        if (data.length != 0) {
            rootOwner = abi.decode(data, (bytes32));
        }

        if(callSuccess == true && rootOwner >> 224 == ERC998_MAGIC_VALUE) {
            // Case 2: Token owner is other top-down composable
            return rootOwner;
        }
        else {
            // Case 3: Token owner is other contract
            // Or
            // Case 4: Token owner is user
            return ERC998_MAGIC_VALUE << 224 | bytes32(uint256(uint160(rootOwnerAddress)));
        }
    }

    function _ownerOfChild(address _childContract, uint256 _childTokenId) internal view returns (address parentTokenOwner, uint256 parentTokenId) {
        parentTokenId = childTokenOwner[_childContract][_childTokenId];
        require(parentTokenId > 0 || childTokenIndex[parentTokenId][_childContract][_childTokenId] > 0);
        return (tokenIdToTokenOwner[parentTokenId], parentTokenId);
    }

    function ownerOfChild(address _childContract, uint256 _childTokenId) external override view returns (bytes32 parentTokenOwner, uint256 parentTokenId) {       
        parentTokenId = childTokenOwner[_childContract][_childTokenId];
        require(parentTokenId > 0 || childTokenIndex[parentTokenId][_childContract][_childTokenId] > 0);
        return (ERC998_MAGIC_VALUE << 224 | bytes32(uint256(uint160(tokenIdToTokenOwner[parentTokenId]))), parentTokenId);
    }

    function onERC721Received(address _operator, address _from, uint256 _childTokenId, bytes calldata _data) external override returns (bytes4) {
        require(_data.length > 0, "_data must contain the uint256 tokenId to transfer the child token to.");
        // convert up to 32 bytes of_data to uint256, owner nft tokenId passed as uint in bytes
        uint256 tokenId;
        assembly {tokenId := calldataload(164)}
        if (_data.length < 32) {
            tokenId = tokenId >> 256 - _data.length * 8;
        }
        receiveChild(_from, tokenId, msg.sender, _childTokenId);
        require(ERC721(msg.sender).ownerOf(_childTokenId) != address(0), "Child token not owned.");
        return ERC721_RECEIVED_NEW;
    }

   function transferChild(uint256 _fromTokenId, address _to, address _childContract, uint256 _childTokenId) external {
        require(false == true, "No utilitzar");
    }

    
    function safeTransferChild(uint256 _fromTokenId, address _to, address _childContract, uint256 _childTokenId, bytes calldata _data) external override {
        require(false == true, "No utilitzar");
    }
   

    function transferChildToParent(uint256 _fromTokenId, address _toContract, uint256 _toTokenId, address _childContract, uint256 _childTokenId, bytes calldata _data) external override {
        require(false == true, "No utilitzar");
    }

    function safeTransferChild(uint256 _fromTokenId, address _to, address _childContract, uint256 _childTokenId) external override {
        require(false == true, "No utilitzar");
    }


    // Càrrega fills de un altre contracte.
    function getChild(address _from, uint256 _tokenId, address _childContract, uint256 _childTokenId) external override {
        require(false == true, "No utilitzar");
    }

    //////////////

    function receiveChild(address _from, uint256 _tokenId, address _childContract, uint256 _childTokenId) private {
        // Veiem que tingui permís per administrar
        require(cartilles[_tokenId].permisAdministrar == true, "No te permis per accedir a la cartilla");
        require(tokenIdToTokenOwner[_tokenId] != address(0), "La cartilla no existeix.");
        require(childTokenIndex[_tokenId][_childContract][_childTokenId] == 0, "Fill ja existent per el pare indicat.");        
        uint256 childTokensLength = childTokens[_tokenId][_childContract].length;
        if (childTokensLength == 0) {
            childContractIndex[_tokenId][_childContract] = childContracts[_tokenId].length;
            childContracts[_tokenId].push(_childContract);
        }
        childTokens[_tokenId][_childContract].push(_childTokenId);
        childTokenIndex[_tokenId][_childContract][_childTokenId] = childTokensLength + 1;
        childTokenOwner[_childContract][_childTokenId] = _tokenId;
        numVacunesCartilla[_tokenId] = numVacunesCartilla[_tokenId] + 1;
        emit ReceivedChild(_from, _tokenId, _childContract, _childTokenId);
    }

    function balanceOf(address _tokenOwner) public view override returns (uint256) {
        require(_tokenOwner != address(0));
        return tokenOwnerToTokenCount[_tokenOwner];
    }

    // Retorna el propietari del contracte.
    function getOwner() public view returns (address) {  
        return owner;
    }

    // Retorna el propietari del contracte.
    function getTokenOwnerToTokenCount(address _from) public view returns (uint256) {    
        return tokenOwnerToTokenCount[_from];
    }

    function getDadesCartilla(uint256 _idToken) public view returns (Cartilla memory) {
        return cartilles[_idToken];
    }

    // Retorna els les adreces dels contractes a partir de un tokenid pare.
    // mapping(uint256 => address[]) private childContracts;
    function getChildContracts(uint256 _tokenId) public view returns (address[] memory){
        return childContracts[_tokenId];
    }

    function getDadesVacunesCartilla(uint256 _idParentToken) public view returns (DadesVacunaCartilla[] memory) {
        uint8 indice = 0;
        //DadesVacunaCartilla[] memory _dadesVacunesCartilla = new DadesVacunaCartilla[](childContracts[_idParentToken].length);
        DadesVacunaCartilla[] memory _dadesVacunesCartilla = new DadesVacunaCartilla[](numVacunesCartilla[_idParentToken]);
        address[] memory adreces = getChildContracts(_idParentToken);
        for (uint8 i = 0; i < adreces.length; i++) {
            uint256[] memory vacunaIdToken = childTokens[_idParentToken][adreces[i]];
            for (uint8 j = 0; j < vacunaIdToken.length; j++) {               
                DadesVacunaCartilla memory newDadesVacunesCartilla = DadesVacunaCartilla({
                    contracteVacuna: adreces[i], 
                    idVacunaToken: vacunaIdToken[j], 
                    vacuna: VacunaTK(adreces[i]).getDadesVacuna(vacunaIdToken[j])
                });
                _dadesVacunesCartilla[indice].contracteVacuna = newDadesVacunesCartilla.contracteVacuna;
                _dadesVacunesCartilla[indice].idVacunaToken = newDadesVacunesCartilla.idVacunaToken;
                _dadesVacunesCartilla[indice].vacuna = newDadesVacunesCartilla.vacuna;
                indice++;
            }                       
        }
        return _dadesVacunesCartilla;
    }

    function setPermisAdministrar(uint256 _tokenId) public {
        require(cartilles[_tokenId].permisAdministrar == false);  
        cartilles[_tokenId].permisAdministrar = true;
    }

    function setNoPermisAdministrar(uint256 _tokenId) public {
        require(cartilles[_tokenId].permisAdministrar == true);  
        cartilles[_tokenId].permisAdministrar = false;
    }

    function getCartillaPacient(address _patientAddress) public view returns (Cartilla memory) {
        return cartillaPacient[_patientAddress];
    }
}