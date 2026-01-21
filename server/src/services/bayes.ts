type Label = string;

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

class NaiveBayes {
  private labelCounts: Map<Label, number> = new Map();
  private tokenCounts: Map<Label, Map<string, number>> = new Map();
  private vocabulary: Set<string> = new Set();
  private totalDocs = 0;

  train(label: Label, text: string) {
    const tokens = tokenize(text);
    this.totalDocs += 1;
    this.labelCounts.set(label, (this.labelCounts.get(label) || 0) + 1);
    let bucket = this.tokenCounts.get(label);
    if (!bucket) {
      bucket = new Map();
      this.tokenCounts.set(label, bucket);
    }
    for (const t of tokens) {
      this.vocabulary.add(t);
      bucket.set(t, (bucket.get(t) || 0) + 1);
    }
  }

  predict(text: string): { label: Label; scores: Record<string, number> } {
    const tokens = tokenize(text);
    const vocabSize = this.vocabulary.size || 1;
    const scores: Record<string, number> = {};

    for (const [label, count] of this.labelCounts.entries()) {
      const prior = Math.log(count / this.totalDocs);
      const bucket = this.tokenCounts.get(label)!;
      let tokenTotal = 0;
      for (const v of bucket.values()) tokenTotal += v;
      let logLikelihood = 0;
      for (const t of tokens) {
        const tc = bucket.get(t) || 0;
        const p = (tc + 1) / (tokenTotal + vocabSize);
        logLikelihood += Math.log(p);
      }
      scores[label] = prior + logLikelihood;
    }

    if (Object.keys(scores).length === 0) return { label: '', scores: {} };

    const max = Math.max(...Object.values(scores));
    const normScores: Record<string, number> = {};
    let denom = 0;
    for (const k of Object.keys(scores)) {
      normScores[k] = Math.exp(scores[k] - max);
      denom += normScores[k];
    }
    for (const k of Object.keys(normScores)) normScores[k] = normScores[k] / (denom || 1);

    let best: Label = Object.keys(normScores)[0];
    for (const k of Object.keys(normScores)) if (normScores[k] > normScores[best]) best = k;
    return { label: best, scores: normScores };
  }
}

export const alertPriorityClassifier = (() => {
  const nb = new NaiveBayes();
  const seeds: Array<{ label: Label; text: string }>[] = [
    [
      { label: 'Low', text: 'routine check minor update no immediate action' },
      { label: 'Low', text: 'information notice low importance' },
      { label: 'Low', text: 'non urgent follow up later' },
    ],
    [
      { label: 'Medium', text: 'elevated fever moderate pain monitor' },
      { label: 'Medium', text: 'requires attention today' },
    ],
    [
      { label: 'High', text: 'severe pain chest shortness urgent review' },
      { label: 'High', text: 'critical lab value immediate contact doctor' },
    ],
    [
      { label: 'Critical', text: 'emergency cardiac arrest stroke code blue' },
      { label: 'Critical', text: 'unresponsive severe bleeding call emergency' },
    ],
  ];
  for (const group of seeds) for (const s of group) nb.train(s.label, s.text);
  return nb;
})();

export const medicalRecordTypeClassifier = (() => {
  const nb = new NaiveBayes();
  const seed: Array<{ label: Label; text: string }> = [
    { label: 'Consultation', text: 'consultation follow up visit clinic advice plan' },
    { label: 'Lab Results', text: 'lab blood test panel results value reference' },
    { label: 'Assessment', text: 'assessment evaluation status review observation' },
    { label: 'Imaging', text: 'imaging x ray mri ct ultrasound scan report' },
    { label: 'Prescription', text: 'prescription medication dosage take daily refills' },
    { label: 'Other', text: 'miscellaneous document other type general note' },
  ];
  for (const s of seed) nb.train(s.label, s.text);
  return nb;
})();

export function classifyAlertPriority(input: { title?: string; message?: string }) {
  const text = `${input.title || ''} ${input.message || ''}`.trim();
  return alertPriorityClassifier.predict(text);
}

export function classifyMedicalRecordType(input: { title?: string; summary?: string; diagnosis?: string }) {
  const text = `${input.title || ''} ${input.summary || ''} ${input.diagnosis || ''}`.trim();
  return medicalRecordTypeClassifier.predict(text);
}
