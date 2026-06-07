import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Header } from "../components/Header";
import {
  buscarRecomendacoes,
  RECOMMENDATION_BATCH_SIZE,
  type RecommendationPayload,
} from "../services/api";

const CUIDADOS_OPTIONS = ["Castrado", "Vacinado", "Vermifugado"];

const SOCIAVEL_MAP: Record<string, string> = {
  "Sim": "sim",
  "Não": "nao",
};

interface Question {
  id: string;
  question: string;
  options: string[];
  multiple?: boolean;
}

const questions: Question[] = [
  {
    id: "tipo",
    question: "Você prefere qual tipo de pet?",
    options: ["🐶 Cachorro", "🐱 Gato"],
  },
  {
    id: "porte",
    question: "Qual porte combina com você?",
    options: ["Pequeno", "Médio", "Grande"],
  },
  {
    id: "idade",
    question: "Qual faixa de idade você prefere?",
    options: ["Filhote (até 1 ano)", "Adulto (1 a 5 anos)", "Sênior (6 anos+)"],
  },
  {
    id: "local",
    question: "O pet vai morar onde?",
    options: ["Apartamento", "Casa com quintal"],
  },
  {
    id: "cuidados",
    question: "Quais cuidados veterinários você prefere que o pet já tenha?",
    options: CUIDADOS_OPTIONS,
    multiple: true,
  },
  {
    id: "sociavel",
    question: "Tem outros animais ou crianças em casa?",
    options: ["Sim", "Não"],
  },
  {
    id: "sexo",
    question: "Qual sexo você prefere?",
    options: ["Macho", "Fêmea", "Ambos"],
  },
];

function extractValue(option: string): string {
  return option
    .replace(/^[^\w]*/, "")
    .replace(/\s*\(.*\)$/, "")
    .trim();
}

function buildRecommendationPayload(
  answers: Record<string, string>,
  multiAnswers: Record<string, string[]>
): RecommendationPayload {
  const cuidados = (multiAnswers.cuidados ?? [])
    .map((cuidado) => cuidado.toLowerCase())
    .join(", ");

  return {
    tipo: extractValue(answers.tipo),
    porte: answers.porte,
    idade: extractValue(answers.idade),
    local: answers.local,
    cuidados,
    sociavel: SOCIAVEL_MAP[answers.sociavel] || "nao",
    sexo: answers.sexo,
    topN: RECOMMENDATION_BATCH_SIZE,
  };
}

export function QuestionPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const q = questions[currentQuestion];
  const currentAnswer = q.multiple ? multiAnswers[q.id] : answers[q.id];
  const hasAnswer = q.multiple ? (multiAnswers[q.id]?.length ?? 0) > 0 : !!answers[q.id];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (option: string) => {
    if (q.multiple) {
      setMultiAnswers((prev) => {
        const current = prev[q.id] ?? [];
        const exists = current.includes(option);
        return { ...prev, [q.id]: exists ? current.filter((o) => o !== option) : [...current, option] };
      });
    } else {
      setAnswers({ ...answers, [q.id]: option });
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return;
    }

    setIsLoading(true);
    try {
      const payload = buildRecommendationPayload(answers, multiAnswers);
      const data = await buscarRecomendacoes(payload);
      navigate("/matches", { state: { recomendacoes: data.recomendacoes, tipo: payload.tipo } });
    } catch (err) {
      console.error(err);
      navigate("/matches");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

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
              {q.question}
            </h2>

            {q.multiple && (
              <p className="text-sm text-muted-foreground mb-4">Selecione quantas quiser (ou nenhuma se não tiver preferência)</p>
            )}
            <div className="space-y-4">
              {q.options.map((option) => {
                const isSelected = q.multiple
                  ? (multiAnswers[q.id] ?? []).includes(option)
                  : currentAnswer === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all group hover:scale-[1.02] ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg">{option}</span>
                      {isSelected && (
                        <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
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
              disabled={(!hasAnswer && !q.multiple) || isLoading}
              className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading
                ? "Calculando matches..."
                : currentQuestion === questions.length - 1
                ? "Ver Matches"
                : "Próxima"}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
