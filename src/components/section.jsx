import QuizIcon from "./quizIcon";

function Section({ textSection, quizzes }) {
  return (
    <div className="bg-raisinBlack w-full h-auto px-6 py-6">
      <h1 className="text-[22px] font-semibold mb-4">
        {textSection}
      </h1>

      <ul className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-items-center">
        {quizzes.map((quiz) => (
          <li key={quiz.id}>
            <QuizIcon id={quiz.id} title={quiz.title} cover={quiz.cover} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Section;
