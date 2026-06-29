export type VoteChoice = "believe" | "cope";

export type VoteState = {
  believeCount: number;
  copeCount: number;
  userVote: VoteChoice | null;
};

export function applyVoteChange(state: VoteState, choice: VoteChoice): VoteState {
  if (state.userVote === choice) {
    return state;
  }

  let believeCount = state.believeCount;
  let copeCount = state.copeCount;

  if (state.userVote === "believe") believeCount -= 1;
  if (state.userVote === "cope") copeCount -= 1;
  if (choice === "believe") believeCount += 1;
  if (choice === "cope") copeCount += 1;

  return { believeCount, copeCount, userVote: choice };
}

export function getVotePercentages(believeCount: number, copeCount: number) {
  const total = believeCount + copeCount;
  if (total === 0) {
    return { believePct: 50, copePct: 50 };
  }

  const believePct = Math.round((believeCount / total) * 100);
  return { believePct, copePct: 100 - believePct };
}
