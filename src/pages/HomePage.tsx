import { Nav } from '../components/layout/Nav';
import { Footer } from '../components/layout/Footer';
import { WhatsAppButton } from '../components/layout/WhatsAppButton';
import { UrgencyBar } from '../components/layout/UrgencyBar';
import { Hero } from '../components/home/Hero';
import { Servicios } from '../components/home/Servicios';
import { Obra } from '../components/home/Obra';
import { Trabajos } from '../components/home/Trabajos';

export function HomePage() {
  return (
    <>
      <UrgencyBar />
      <Nav />
      <Hero />
      <Servicios />
      <Obra />
      <Trabajos />
      <Footer />
      <WhatsAppButton />
    </>
  );
}
