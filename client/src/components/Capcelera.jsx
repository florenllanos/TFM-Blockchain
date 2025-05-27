import React from 'react';
import { Navbar, NavbarBrand, Container, Nav, NavItem, NavLink } from 'reactstrap';
import logo from '../assets/Logo.png';

const Capcelera = () => (
  <Navbar color="dark" dark expand="md">
    <Container>
      <NavbarBrand href="/">
        <img
          src={logo}
          alt="https://creativecommons.org/licenses/by/4.0/"
          height="40"
          className="me-2"
        />
        BlockVac
      </NavbarBrand>
      <Nav className="me-auto" navbar>
        <NavItem>
          <NavLink href="/">Vacuna</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/lot/">Lot</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/transferir-vacuna-lot/">Transferir vacuna-lot</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/transferir-lot/">Transferir-lot</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/cartilla/">Cartilla</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/cartilla-pacient/">Cartilla-pacient</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/lot-centre/">Lot-centre</NavLink>
        </NavItem>        
      </Nav>
    </Container>
  </Navbar>
);

export default Capcelera;