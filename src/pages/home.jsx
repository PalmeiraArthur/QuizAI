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
        <main className="bg-russianViolet bg-gradient-padrao  rounded-t-[13px] mt-[20px]  w-screen h-dvh flex flex-col gap-[30px] items-center shadow-[0px_0px_17px_3px_rgba(0,_0,_0,_0.4)]
        lg:w-[1140px] lg:pt-[80px] lg:rounded-none lg:mt-[60px] ">
          <div className="mt-[40px] text-[22px] font-semibold text-center flex flex-col gap-10">
            <div className="flex flex-col items-center gap-1">
              <div className="flex">
                <p className="text-2xl">Este é o Quiz AI</p>
                <p className="text-pistachio text-2xl">!</p>
              </div>

              <p>Aqui você cria Quizzes personalizados com ajuda da inteligencia artificial.</p>

            </div>

            <div className="flex flex-row gap-1 items-center justify-center">
              <p className="text-pistachio text-shadow-pistachio text-shadow-lg/20">Crie</p>
              <p>, </p>
              <p className="text-pistachio text-shadow-pistachio text-shadow-lg/20">estude</p>
              <p> e</p>
              <p className="text-pistachio text-shadow-pistachio text-shadow-lg/20">divirta-se</p>
              <p>!</p>

            </div>

          </div>

          <ConnectionHub />
        </main>
      </div>
    </BackgroundPattern>
  );
}

export default Home;
