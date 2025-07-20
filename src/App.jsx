import About from "./components/About";
import Hero from "./components/Hero";
import NavBar from "./components/Navbar";
import Features from "./components/Features";
import Story from "./components/Story";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import PubgOutfit from "./components/PubgOutfit";
import PubgGuns from "./components/PubgGuns";
import PubgVehicle from "./components/PubgVehicle";
import Guns from "./components/Guns";

function App() {
  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden">
      <NavBar />
      <Hero />
      <About />
      <Features />
      <Story />
      <Guns />
      {/* <PubgOutfit /> */}
      {/* <PubgGuns /> */}
      {/* <PubgVehicle /> */}
      <Contact />
      <Footer />
    </main>
  );
}

export default App;
