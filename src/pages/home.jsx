import Navbar from "../components/navbar"
import ConnectionHub from "../components/connectionHub"
import Section from "../components/section"

function Home() {
    return (
        <div>
            <header>
                <Navbar />
            </header>

            <main className="bg-darkGunmetal w-[1140px] h-screen pt-[80px] flex justify-start items-center flex-col gap-[30px] ">
                <ConnectionHub />
                
                <Section textSection="Novos" />

                <Section textSection="Populares"/>



            </main>

        </div>
    )
}

export default Home