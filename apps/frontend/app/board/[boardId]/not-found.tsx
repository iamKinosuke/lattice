import { BoardUnavailable } from "@/components/board/board-unavailable";

export default function BoardNotFound() {
  return (
    <BoardUnavailable
      title="This board is not here"
      body="That link does not point at a board. It may have been truncated on the way to you."
    />
  );
}
