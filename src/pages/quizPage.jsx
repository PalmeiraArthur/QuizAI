import { useParams, useNavigate } from "react-router-dom";
import { novosQuizzes, popularesQuizzes } from "../data/mockData";
import { getBackgroundColor } from "../components/getBackgroundColor";

function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const allQuizzes = [...novosQuizzes, ...popularesQuizzes];
  const quiz = allQuizzes.find((q) => q.id.toString() === id);

  if (!quiz) {
    return <p className="text-white text-center mt-10">Quiz não encontrado!</p>;
  }

  const bgColor = getBackgroundColor(quiz.title);

  return (
    <div className="flex items-center justify-center w-screen h-dvh bg-darkGunmetal text-white 
    md:w-[1140px] md:h-screen md:mt-0 md:rounded-none">


      <div className="flex relative justify-center items-center flex-col gap-[20px] bg-raisinBlack h-[500px] w-full
      md:w-full md:h-[700px] md:flex-row md:gap-[80px]">

        <button onClick={() => navigate("/home")} className="absolute top-[10px] left-[10px] drop-shadow-2xl cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none"><path fill="#5649B7" d="M40 20c0 11.046-8.954 20-20 20S0 31.046 0 20 8.954 0 20 0s20 8.954 20 20Z" /><path fill="#fff" d="m8.435 20.136 17.551-10.133v20.266L8.436 20.136Z" /></svg>
        </button>

        <div className="flex flex-col justify-center items-center gap-[3px] text-[20px]
        md:text-[30px]">
          <div className="w-[132px] h-[132px] rounded-lg shadow-md flex items-center justify-center
        md:h-[270px] md:w-[270px]" style={{ backgroundColor: bgColor }}>
            <img
              src={quiz.cover}
              alt={quiz.title}
              className="w-[70px] h-[70px] object-contain 
            md:h-[180px] md:w-[180px]"
            />
          </div>
          <p>
            {quiz.title}
          </p>

        </div>


        <div className="flex flex-col gap-2 justify-center items-center">
          <button className="flex justify-start items-center h-[50px] w-[170px] pl-[40px] gap-[30px] bg-plumpPurple rounded-[5px] font-bold hover:bg-white hover:text-plumpPurple cursor-pointer 
          md:w-[364px] md:h-[90px] md:text-[39px] ">
            <div>
              ▶
            </div>
            <div>
              jogar
            </div>
          </button>

          <button className="flex justify-start items-center h-[50px] w-[170px] pl-[20px] gap-[20px] bg-[#FC5657] rounded-[5px] font-bold hover:bg-white hover:text-[#FC5657] cursor-pointer 
          md:w-[364px] md:h-[90px] md:text-[39px] ">
            <div>
              🏆
            </div>
            <div>
              Ranking
            </div>
          </button>
          <button className="flex justify-start items-center h-[50px] w-[170px] pl-[15px] gap-[10px] bg-[#567DFC] rounded-[5px] font-bold hover:bg-white hover:text-[#567DFC] cursor-pointer 
          md:w-[364px] md:h-[90px] md:text-[39px] ">
            <div>
              🔗
            </div>
            <div>
              Compartilhar
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;
