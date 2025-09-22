import QuizIcon from "./quizIcon"

function Section({textSection}) {
  return (
    <div className="bg-raisinBlack w-full h-[280px]">

      <h1 className="ml-[26px] my-[14px] text-[22px] font-semibold">
        {textSection}
      </h1>

      <ul>
        <li> <QuizIcon/> </li>
      </ul>

    </div>
  )
}

export default Section    