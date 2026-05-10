import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Header } from "../components/Header";

// Mapeamento das respostas para os valores esperados pelo backend
const CUIDADOS_MAP: Record<string, string> = {
  "Sim, quero castrado, vacinado e vermifugado": "completo",
  "Posso cuidar depois":                          "depois",
  "Tanto faz":                                    "tanto_faz",
};

const SOCIAVEL_MAP: Record<string, string> = {
  "Sim": "sim",
  "Não": "nao",
};

const questions = [
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
    question: "Você prefere um pet com saúde em dia?",
    options: [
      "Sim, quero castrado, vacinado e vermifugado",
      "Posso cuidar depois",
      "Tanto faz",
    ],
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

// Extrai o valor limpo da opção (remove emoji e parênteses de legenda)
function extractValue(option: string): string {
  return option
    .replace(/^[^\w]*/, "")    // remove emojis/espaços iniciais
    .replace(/\s*\(.*\)$/, "") // remove "(até 1 ano)" etc.
    .trim();
}

export function QuestionPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const q = questions[currentQuestion];
  const currentAnswer = answers[q.id];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (option: string) => {
    setAnswers({ ...answers, [q.id]: option });
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return;
    }

    // Última pergunta: chama a API de recomendação
    setIsLoading(true);
    try {
      const tipoRaw    = extractValue(answers.tipo);   // "Cachorro" ou "Gato"
      const porteRaw   = answers.porte;                // "Pequeno" | "Médio" | "Grande"
      const idadeRaw   = extractValue(answers.idade);  // "Filhote" | "Adulto" | "Sênior"
      const localRaw   = answers.local;
      const cuidadosRaw = CUIDADOS_MAP[answers.cuidados] || "tanto_faz";
      const socialRaw  = SOCIAVEL_MAP[answers.sociavel]  || "nao";
      const sexoRaw    = answers.sexo;

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const token   = localStorage.getItem("petmatch_token");

      const res = await fetch(`${API_URL}/recomendacao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tipo:     tipoRaw,
          porte:    porteRaw,
          idade:    idadeRaw,
          local:    localRaw,
          cuidados: cuidadosRaw,
          sociavel: socialRaw,
          sexo:     sexoRaw,
          topN:     10,
        }),
      });

      if (!res.ok) throw new Error("Falha na recomendação");

      const data = await res.json();
      // Passa os resultados via state para a página de matches
      navigate("/matches", { state: { recomendacoes: data.recomendacoes, tipo: tipoRaw } });
    } catch (err) {
      console.error(err);
      // Em caso de falha, navega mesmo assim (a página de matches trata estado vazio)
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
          {/* Barra de progresso */}
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

          {/* Card da pergunta */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-6">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              {q.question}
            </h2>

            <div className="space-y-4">
              {q.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all group hover:scale-[1.02] ${
                    currentAnswer === option
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
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

          {/* Navegação */}
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
              disabled={!currentAnswer || isLoading}
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
