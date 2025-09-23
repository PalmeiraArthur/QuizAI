function ConnectionHub() {
    return (
        <div className="flex justify-center items-center gap-2 bg-raisinBlack p-[20px] w-[359px] h-[75px] rounded-[50px] mt-[30px] font-semibold text-[22px]
        md:w-[617px] md:h-[100px]">

            <button className="bg-plumpPurple rounded-[50px] w-[100px] h-[50px] text-[18px] hover:bg-white hover:text-plumpPurple cursor-pointer
            md:w-[180px] md:h-[61px] md:text-[22px]">
                Entrar
            </button>

            <button className="bg-plumpPurple rounded-[50px] w-[100px] h-[50px] text-[18px] hover:bg-white hover:text-plumpPurple cursor-pointer
            md:w-[180px] md:h-[61px] md:text-[22px]">
                Criar
            </button>

            <button className="bg-plumpPurple rounded-[50px] w-[100px] h-[50px] text-[18px] hover:bg-white hover:text-plumpPurple cursor-pointer
            md:w-[180px] md:h-[61px] md:text-[22px]">
                Amigos
            </button>

        </div>
    )
}

export default ConnectionHub