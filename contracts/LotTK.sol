// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

//import "@openzeppelin/contracts/utils/Counters.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "./VacunaTK.sol";

import {IERC998ERC721TopDown} from "./interfaces/IERC998ERC721TopDown.sol";

contract LotTK is ERC721, IERC998ERC721TopDown {

    // Estructura amb les dades del lot.
    struct Lot {
        string idLot;
        string fabricant;
        string nomLot;
        string dataFabricacio;
        bool lotTancat;
        // TODO: fitxer;
    }

    // Mapping de lots a partir del id del Token ERC721, podem obtenir la informació de un lot.
    mapping(uint256 => Lot) private lots;

    // Mapping de lots creades, Lot[], per empresa fabricant, address.
    mapping(address => Lot[])  private lotsFabricant;

    // Estructura dades vacuna dintre del lot. Vacunes asignades.
    struct DadesVacunaLot {
        address contracteVacuna;
        uint256 idVacunaToken;
        VacunaTK.Vacuna vacuna;
    }

    // Quantitat de vacunes que té un lot (idParentToken => num vacunes).
    mapping(uint256 => uint256) private numVacunesLot;

    // Contador automàtic per evitar repeticions en el tokenId.
    /*using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;*/
    uint256 tokenId = 0;

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

    /* child address => childId => tokenId. A partir del contracte de un fill, i del seu id fill, podem veure quin es el seu propietari (idToken del pare). 
    En el nostre cas, a partir de un contracte que genera vacunes i del id de una de les vacunes generades, podem trobar el id pare/lot. */
    mapping(address => mapping(uint256 => uint256)) internal childTokenOwner;

    // tokenId => child contract
    mapping(uint256 => address[]) private childContracts;

    // tokenId => (child address => contract index+1)
    mapping(uint256 => mapping(address => uint256)) private childContractIndex;

    // token owner => (operator address => bool)
    mapping(address => mapping(address => bool)) internal tokenOwnerToOperators;

    // root token owner address => (tokenId => approved address)
    mapping(address => mapping(uint256 => address)) internal rootOwnerAndTokenIdToApprovedAddress;

    // token owner address => token count. Conté per un propietari, el número de tokens que són "seus".
    mapping(address => uint256) internal tokenOwnerToTokenCount;

    constructor() ERC721("LoteTK", "LTK") {}

    function mint(address to, string memory _idLot, string memory _fabricant, string memory _nomLot, string memory _dataFabricacio) public {
        Lot memory newLot = Lot({
            idLot: _idLot,
            fabricant: _fabricant,
            nomLot: _nomLot,            
            dataFabricacio: _dataFabricacio,
            lotTancat: false
        });
        lotsFabricant[to].push(newLot);
        safeMint(to, newLot);
    }
   
    function safeMint(address to, Lot memory _newLot) public {    
        //_tokenIdCounter.increment();
        //uint256 tokenId = _tokenIdCounter.current();
        lots[tokenId] = _newLot;                   
        tokenIdToTokenOwner[tokenId] = to;
        tokenOwnerToTokenCount[to]++;                             
        _safeMint(to, tokenId);
        tokenId++;
    }

    function isContract(address _addr) internal view returns (bool) {
        uint256 size;
        assembly {size := extcodesize(_addr)}
        return size > 0;
    }

    function setApprovalForAll(address _operator, bool _approved) public override {
        require(_operator != address(0));
        tokenOwnerToOperators[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    ///////// Implementació interficie ERC998ERC721TopDown ////////

    function _transferFrom(address _from, address _to, uint256 _tokenId) private {     
        require(_from != address(0));
        require(tokenIdToTokenOwner[_tokenId] == _from);
        require(_to != address(0));

        if(msg.sender != _from) {            
            (bool callSuccess, bytes memory data) = _from.staticcall(abi.encodeWithSelector(0xed81cdda, address(this), _tokenId));
            bytes32 rootOwner = abi.decode(data, (bytes32));
            if(callSuccess == true) {
                require(rootOwner >> 224 != ERC998_MAGIC_VALUE, "Token is child of other top down composable");
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

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public virtual override {
        _transferFrom(_from, _to, _tokenId);
        if (isContract(_to)) {
            bytes4 retval = IERC721Receiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data);
            require(retval == ERC721_RECEIVED_OLD || retval == ERC721_RECEIVED_NEW);
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
        require(_data.length > 0, "Lot incorrecte");
        // convert up to 32 bytes of_data to uint256, owner nft tokenId passed as uint in bytes
        uint256 tokenId;
        assembly {tokenId := calldataload(164)}
        if (_data.length < 32) {
            tokenId = tokenId >> 256 - _data.length * 8;
        }
        receiveChild(_from, tokenId, msg.sender, _childTokenId);
        require(ERC721(msg.sender).ownerOf(_childTokenId) != address(0), "Vacuna no permesa");
        return ERC721_RECEIVED_NEW;
    }

    function transferChild(uint256 _fromTokenId, address _to, address _childContract, uint256 _childTokenId) external {
        require(false == true);
    }

    
    function safeTransferChild(uint256 _fromTokenId, address _to, address _childContract, uint256 _childTokenId, bytes calldata _data) external override {
        uint256 tokenId = childTokenOwner[_childContract][_childTokenId];
        require(tokenId > 0 || childTokenIndex[tokenId][_childContract][_childTokenId] > 0);
        require(tokenId == _fromTokenId);
        require(_to != address(0));
        address rootOwner = address(uint160(uint256(rootOwnerOf(tokenId))));
        require(rootOwner == msg.sender || tokenOwnerToOperators[rootOwner][msg.sender] ||
        rootOwnerAndTokenIdToApprovedAddress[rootOwner][tokenId] == msg.sender);
        removeChild(tokenId, _childContract, _childTokenId);
        ERC721(_childContract).safeTransferFrom(address(this), _to, _childTokenId, _data);
        emit TransferChild(tokenId, _to, _childContract, _childTokenId);
    }   

    function transferChildToParent(uint256 _fromTokenId, address _toContract, uint256 _toTokenId, address _childContract, uint256 _childTokenId, bytes calldata _data) external override {
        require(false == true);
    }

    function removeChild(uint256 _tokenId, address _childContract, uint256 _childTokenId) private {        
        uint256 tokenIndex = childTokenIndex[_tokenId][_childContract][_childTokenId];        
        require(tokenIndex != 0, "Child token not owned by token.");            
        // remove child token        
        uint256 lastTokenIndex = childTokens[_tokenId][_childContract].length - 1;        
        uint256 lastToken = childTokens[_tokenId][_childContract][lastTokenIndex];      
        if (_childTokenId == lastToken) {            
            childTokens[_tokenId][_childContract][tokenIndex - 1] = lastToken;            
            childTokenIndex[_tokenId][_childContract][lastToken] = tokenIndex;            
        }        
        uint totalTokens = childTokens[_tokenId][_childContract].length;        
        if (totalTokens - 1 == 0) {           
            delete childTokens[_tokenId][_childContract];            
        } else {           
            delete childTokens[_tokenId][_childContract][totalTokens - 1];            
        }        
        delete childTokenIndex[_tokenId][_childContract][_childTokenId];        
        delete childTokenOwner[_childContract][_childTokenId];
        // remove contract
        if (lastTokenIndex == 0) {           
            uint256 lastContractIndex = childContracts[_tokenId].length - 1;          
            address lastContract = childContracts[_tokenId][lastContractIndex];                      
            if (_childContract != lastContract) {              
                uint256 contractIndex = childContractIndex[_tokenId][_childContract];                
                childContracts[_tokenId][contractIndex] = lastContract;                
                childContractIndex[_tokenId][lastContract] = contractIndex;                
            }            
            delete childContracts[_tokenId];            
            delete childContractIndex[_tokenId][_childContract];        
        }
    }

    function safeTransferChild(uint256 _fromTokenId, address _to, address _childContract, uint256 _childTokenId) external override {
        require(false == true);
    }
    // Càrrega fills de un altre contracte.
    function getChild(address _from, uint256 _tokenId, address _childContract, uint256 _childTokenId) external override {
        require(false == true);
    }

    function receiveChild(address _from, uint256 _tokenId, address _childContract, uint256 _childTokenId) private {
        require(tokenIdToTokenOwner[_tokenId] != address(0), "El Lot no existeix.");
        require(childTokenIndex[_tokenId][_childContract][_childTokenId] == 0, "Fill ja existent per el pare indicat.");        
        uint256 childTokensLength = childTokens[_tokenId][_childContract].length;
        if (childTokensLength == 0) {
            childContractIndex[_tokenId][_childContract] = childContracts[_tokenId].length;
            childContracts[_tokenId].push(_childContract);
        }
        childTokens[_tokenId][_childContract].push(_childTokenId);
        childTokenIndex[_tokenId][_childContract][_childTokenId] = childTokensLength + 1;
        childTokenOwner[_childContract][_childTokenId] = _tokenId;
        numVacunesLot[_tokenId] = numVacunesLot[_tokenId] + 1;
        emit ReceivedChild(_from, _tokenId, _childContract, _childTokenId);
    }

    // Retorna els les adreces dels contractes a partir de un tokenid pare.
    function getChildContracts(uint256 _tokenId) public view returns (address[] memory){
        return childContracts[_tokenId];
    }

    /*function ownerOf(uint256 _tokenId) public view override returns (address tokenOwner) {
        tokenOwner = tokenIdToTokenOwner[_tokenId];
        require(tokenOwner != address(0));
        return tokenOwner;
    }*/
    
    function getOwner() public view returns (address) {           
        return owner;
    }

    function getDadesLot(uint256 _idToken) public view returns (Lot memory) {
        return lots[_idToken];
    }

    // Lots donats d'alta per empresa.
    function getLotsEmpresa(address _creadorLot) public view returns (Lot[] memory) {
        return lotsFabricant[_creadorLot];
    }

    // Vacunes per lot.
    function getDadesVacunesLot(uint256 _idParentToken) public view returns (DadesVacunaLot[] memory) {
        uint8 indice = 0;
        DadesVacunaLot[] memory _dadesVacunesLot = new DadesVacunaLot[](numVacunesLot[_idParentToken]);
        address[] memory adreces = getChildContracts(_idParentToken);
        for (uint8 i = 0; i < adreces.length; i++) {
            uint256[] memory vacunaIdToken = childTokens[_idParentToken][adreces[i]];
            for (uint8 j = 0; j < vacunaIdToken.length; j++) {               
                DadesVacunaLot memory newDadesVacunesLot = DadesVacunaLot({
                    contracteVacuna: adreces[i], 
                    idVacunaToken: vacunaIdToken[j], 
                    vacuna: VacunaTK(adreces[i]).getDadesVacuna(vacunaIdToken[j])
                });
                _dadesVacunesLot[indice].contracteVacuna = newDadesVacunesLot.contracteVacuna;
                _dadesVacunesLot[indice].idVacunaToken = newDadesVacunesLot.idVacunaToken;
                _dadesVacunesLot[indice].vacuna = newDadesVacunesLot.vacuna;
                indice++;
            }                      
        }
        return _dadesVacunesLot;
    }
}