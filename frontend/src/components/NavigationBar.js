import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { LinkContainer } from 'react-router-bootstrap'


function NavigationBar() {
    return (
        <Navbar bg="light" expand="lg">
            <Container>
                <Navbar.Brand>SENTINEL</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <LinkContainer to="/">
                            <Nav.Link>Vulnerabilities</Nav.Link>
                        </LinkContainer>
                        <NavDropdown title="Announcement">
                            <NavDropdown.ItemText> 
                                <LinkContainer to="/announcement">
                                    <Nav.Link>Public</Nav.Link>
                                </LinkContainer>
                            </NavDropdown.ItemText>
                            <NavDropdown.ItemText>
                                <LinkContainer to="/confidentialAnnouncement">
                                    <Nav.Link>Confidential</Nav.Link>
                                </LinkContainer>
                            </NavDropdown.ItemText>
                        </NavDropdown>
                        <NavDropdown title="Settings">
                            <NavDropdown.ItemText>
                                <LinkContainer to="/settings">
                                    <Nav.Link>General</Nav.Link>
                                </LinkContainer>
                            </NavDropdown.ItemText>
                            <NavDropdown.ItemText>
                                <LinkContainer to="/confidentialSettings">
                                    <Nav.Link>Confidential</Nav.Link>
                                </LinkContainer>
                            </NavDropdown.ItemText>
                        </NavDropdown>

                        <LinkContainer to="/accounts">
                            <Nav.Link>Accounts</Nav.Link>
                        </LinkContainer>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
export default NavigationBar;