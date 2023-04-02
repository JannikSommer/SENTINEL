import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
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
            <LinkContainer to="/announcement">
              <Nav.Link>Announcement</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/confidential">
              <Nav.Link>Confidential Announcements</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/settings">
              <Nav.Link>Settings</Nav.Link>
            </LinkContainer>
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