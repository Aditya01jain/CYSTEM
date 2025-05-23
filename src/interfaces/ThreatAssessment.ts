export type ACKTypeData = {
  question: string;
  question_type: string;
  expire_acknowledgement_time: number;
  choices?: Array<{ title: string }>;
  [k: string]: any;
};
