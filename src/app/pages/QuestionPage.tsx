import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Header } from "../components/Header";

const questions = [
  {
    id: 1,
    question: "Que tipo de animal você prefere?",
    options: ["Cachorro", "Gato", "Ambos"],
  },
  {
    id: 2,
    question: "Qual porte de animal você procura?",
    options: ["Pequeno", "Médio", "Grande", "Qualquer um"],
  },
  {
    id: 3,
    question: "Qual nível de energia você prefere?",
    options: ["Calmo e tranquilo", "Moderado", "Muito enérgico"],
  },
  {
    id: 4,
    question: "Você tem crianças em casa?",
    options: ["Sim", "Não"],
  },
  {
    id: 5,
    question: "Você tem outros animais?",
    options: ["Sim, cachorro(s)", "Sim, gato(s)", "Sim, ambos", "Não"],
  },
  {
    id: 6,
    question: "Qual o tamanho do seu espaço?",
    options: ["Apartamento pequeno", "Apartamento grande", "Casa com quintal", "Casa com quintal grande"],
  },
  {
    id: 7,
    question: "Quanto tempo você tem disponível?",
    options: ["Pouco tempo", "Tempo moderado", "Muito tempo"],
  },
];

export function QuestionPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      navigate('/swipe');
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentAnswer = answers[questions[currentQuestion].id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" showNav={false} />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground">
                Pergunta {currentQuestion + 1} de {questions.length}
              </span>
              <span className="text-sm font-semibold text-primary">
                {Math.round(progress)}% completo
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-6">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              {questions[currentQuestion].question}
            </h2>

            <div className="space-y-4">
              {questions[currentQuestion].options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all group hover:scale-[1.02] ${
                    currentAnswer === option
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">{option}</span>
                    {currentAnswer === option && (
                      <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              disabled={currentQuestion === 0}
              className="px-6 py-4 bg-white border-2 border-border rounded-2xl font-semibold hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {currentQuestion === questions.length - 1 ? 'Ver Matches' : 'Próxima'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
