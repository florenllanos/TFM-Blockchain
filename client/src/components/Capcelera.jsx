import React from 'react';
import { Navbar, NavbarBrand, Container } from 'reactstrap';
import logo from '../assets/Logo.png';

const Capcelera = () => (
  <Navbar color="dark" dark expand="md">
    <Container>
      <NavbarBrand href="/">
        <img
          src={logo}
          alt="Logo"
          height="40"
          className="me-2"
        />
        BlockVac
      </NavbarBrand>
    </Container>
  </Navbar>
);

export default Capcelera;