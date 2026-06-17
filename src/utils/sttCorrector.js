// src/utils/sttCorrector.js

export const correctSttText = (text) => {
  if (!text) return "";

  // 💡 여기에 오인식되는 단어들을 계속 추가해 나가시면 됩니다!
  const correctionDict = {
    "제1을": "제일을",
    "제1이": "제일이",
    "제1은": "제일은",
    "제1도": "제일도",
    "제1하느라": "제일하느라",
    "티타임지": "teatimes",
    "넥스트 제이에스": "Next.js"
  };

  let corrected = text;
  
  for (const [wrongText, rightText] of Object.entries(correctionDict)) {
    const regex = new RegExp(wrongText, "g");
    corrected = corrected.replace(regex, rightText);
  }

  return corrected;
};