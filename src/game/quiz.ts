export interface QuizQuestion {
  id: string
  questionKey: string
  optionKeys: string[]
  correctIndex: number
  bonus: number
}

export const QUIZZES: Record<string, QuizQuestion[]> = {
  'china-wall': [
    {
      id: 'q1',
      questionKey: 'quiz.china-wall.q1.question',
      optionKeys: [
        'quiz.china-wall.q1.opt0',
        'quiz.china-wall.q1.opt1',
        'quiz.china-wall.q1.opt2',
      ],
      correctIndex: 1,
      bonus: 25,
    },
    {
      id: 'q2',
      questionKey: 'quiz.china-wall.q2.question',
      optionKeys: [
        'quiz.china-wall.q2.opt0',
        'quiz.china-wall.q2.opt1',
        'quiz.china-wall.q2.opt2',
      ],
      correctIndex: 0,
      bonus: 25,
    },
    {
      id: 'q3',
      questionKey: 'quiz.china-wall.q3.question',
      optionKeys: [
        'quiz.china-wall.q3.opt0',
        'quiz.china-wall.q3.opt1',
        'quiz.china-wall.q3.opt2',
      ],
      correctIndex: 2,
      bonus: 25,
    },
    {
      id: 'q4',
      questionKey: 'quiz.china-wall.q4.question',
      optionKeys: [
        'quiz.china-wall.q4.opt0',
        'quiz.china-wall.q4.opt1',
        'quiz.china-wall.q4.opt2',
      ],
      correctIndex: 0,
      bonus: 25,
    },
  ],
}
