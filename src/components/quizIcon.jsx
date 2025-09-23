// No quizIcon são criados dois props, o titulo e o cover que são associados a um quadrado com cor aleatoria gerado pelo getBackgroundColor.


import { getBackgroundColor } from "./getBackgroundColor";

function QuizIcon({ title, cover }) {
  const bgColor = getBackgroundColor(title);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative group w-[93px] h-[93px] rounded-[5px] shadow-md flex items-center justify-center overflow-hidden cursor-pointer md:w-[132px] md:h-[132px]"
        style={{ backgroundColor: bgColor }}
      >
        <div className="absolute inset-0 rounded-lg bg-black/20 opacity-0 group-hover:opacity-100 z-0" />

        <img
          src={cover}
          alt={title}
          className="relative z-10 w-[60px] h-[60px] object-contain group-hover:scale-110
          md:w-[90px] md:h-[90px]"
        />
      </div>

      <p className="font-medium text-center mt-2 text-sm w-[132px] truncate">
        {title}
      </p>
    </div>
  );
}

export default QuizIcon;
