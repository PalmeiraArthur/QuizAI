// src/pages/home.jsx
import Navbar from "../components/navbar";
import ConnectionHub from "../components/connectionHub";
import BackgroundPattern from "../components/backgroundPattern";


function Home() {
  return (
    <BackgroundPattern>
      <div>
        <header>
          <Navbar />
        </header>
        <main className="bg-russianViolet bg-gradient-padrao mt-[40px] rounded-t-[13px] w-screen h-dvh flex flex-col gap-[30px] items-center shadow-[0px_0px_17px_3px_rgba(0,_0,_0,_0.4)]
        lg:w-[1140px] lg:mt-0 lg:pt-[80px] lg:rounded-none ">
          <ConnectionHub />
          <h1>
            working in progress...
          </h1>
        </main>
      </div>
    </BackgroundPattern>
  );
}

export default Home;
