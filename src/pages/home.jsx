//aqui no home eu apenas defino qual a constante que eu quero puxar os ids e ele renderiza a lista com os ids em sequencia e consequentemente seu cover e seu titulo.

import Navbar from "../components/navbar";
import ConnectionHub from "../components/connectionHub";
import Section from "../components/section";
import { novosQuizzes, popularesQuizzes } from "../data/mockData";

function Home() {
  return (
    <div>
      <header>
        <Navbar />
      </header>

      <main className="bg-darkGunmetal mt-[100px] rounded-t-[13px] w-full min-h-screen flex flex-col gap-[30px] items-center shadow-[0px_0px_17px_3px_rgba(0,_0,_0,_0.4)]
      md:w-[1140px] md:mt-0 md:pt-[80px] md:rounded-none ">
        <ConnectionHub />

        {/* Seção de Novos Quizzes */}
        <Section textSection="Novos" quizzes={novosQuizzes} />

        {/* Seção de Quizzes Populares */}
        <Section textSection="Populares" quizzes={popularesQuizzes} />
      </main>
    </div>
  );
}

export default Home;
