export interface QuestionInput {
  question: string
  answer: string
}

export interface ValidationResult {
  valid: boolean
  questions?: QuestionInput[]
  error?: string
}

export function validateQuestionsJson(json: unknown): ValidationResult {
  // Handle both { questions: [...] } and [...] formats
  let questions: unknown[]

  if (Array.isArray(json)) {
    questions = json
  } else if (
    typeof json === "object" &&
    json !== null &&
    "questions" in json &&
    Array.isArray((json as { questions: unknown }).questions)
  ) {
    questions = (json as { questions: unknown[] }).questions
  } else {
    return {
      valid: false,
      error:
        "Invalid format. Expected an array of questions or { questions: [...] }",
    }
  }

  if (questions.length === 0) {
    return {
      valid: false,
      error: "No questions found in file",
    }
  }

  const validated: QuestionInput[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (typeof q !== "object" || q === null) {
      return {
        valid: false,
        error: `Question ${i + 1} is not an object`,
      }
    }

    const qObj = q as Record<string, unknown>
    if (typeof qObj.question !== "string" || qObj.question.trim() === "") {
      return {
        valid: false,
        error: `Question ${i + 1} is missing a valid "question" field`,
      }
    }

    if (typeof qObj.answer !== "string" || qObj.answer.trim() === "") {
      return {
        valid: false,
        error: `Question ${i + 1} is missing a valid "answer" field`,
      }
    }

    validated.push({
      question: qObj.question.trim(),
      answer: qObj.answer.trim(),
    })
  }

  return {
    valid: true,
    questions: validated,
  }
}
