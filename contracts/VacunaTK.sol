// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//import "@openzeppelin/contracts/utils/Counters.sol";

contract VacunaTK is ERC721 {

    // Estructura amb les dades de la vacuna.
    struct Vacuna {
        uint256 idToken;
        string idVacuna;
        bool termolabil;
        int16 tempConservacio;
        string dataCaducitat;
        bool asignadaLot;
        bool administrada;
    }

    // Mapping de vacunes a partir del id del Token ERC721.
    mapping(uint256 => Vacuna) private vacunas;

    // Mapping de vacunes creades, Vacuna[], per empresa fabricant, address.    
    mapping(address => uint256[])  private vacunesFabricant;

    // Contador tokenId.    
    uint256 private tokenId = 1;

    address public owner;

    constructor() ERC721("VacunaTK", "VTK") {}

    function mint(address to, string memory _idVacuna, bool _termolabil, int16 _tempConservacio, string memory _dataCaducitat) public {
        Vacuna memory newVacuna = Vacuna({
            idToken: tokenId,
            idVacuna: _idVacuna,
            termolabil: _termolabil,
            tempConservacio: _tempConservacio,            
            dataCaducitat: _dataCaducitat,
            asignadaLot: false,
            administrada: false
        });
        vacunesFabricant[to].push(tokenId);
        vacunas[newVacuna.idToken]= newVacuna;
        safeMint(to, newVacuna);
        tokenId++;
    }
   
    function safeMint(address to, Vacuna memory _newVacuna) public {        
        _safeMint(to, _newVacuna.idToken);               
    }

    // Retorna el propietari del contracte.
    function getOwner() public view returns (address) {    
        return owner;
    }

    function getDadesVacuna(uint256 _idToken) public view returns (Vacuna memory) {
        return vacunas[_idToken];
    }

    // Retorna les vacunes creades per empresa.
    function getVacunesEmpresa(address _creadorVacuna) public view returns (Vacuna[] memory) {
        uint256[] storage id = vacunesFabricant[_creadorVacuna];
        Vacuna[] memory resVac = new Vacuna[](id.length);
        for (uint i = 0; i < id.length; i++) {
            resVac[i] = vacunas[id[i]];
        }
        return resVac;
    }

    // Sobreescrivim safeTransferFrom per marcar les vacunes asignades a lot.
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public virtual override {
        vacunas[_tokenId].asignadaLot = true;
        super.safeTransferFrom(_from, _to, _tokenId, _data);
    }
}