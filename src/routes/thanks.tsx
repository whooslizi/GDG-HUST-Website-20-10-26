import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dbService } from "@/services/app-database";
import type { Girl } from "@/types/database";
import { LetterSheet } from "@/features/quiz/components/LetterSheet";
import { INVITE_TITLE, INVITE_PS, inviteBody } from "@/features/quiz/invitation";

export const Route = createFileRoute("/thanks")({
  component: ThanksPage,
});

const THANKS = `Cảm ơn bạn đã dành thời gian tham dự buổi tiệc mừng Ngày Phụ nữ Việt Nam 20/10 của GDG-HUST. Sự có mặt của bạn chính là món quà lớn nhất mà chúng mình nhận được trong tối hôm ấy.

Dù bạn là người ngày ngày gõ những dòng code, hay là người lo từng tấm poster, từng buổi sự kiện, từng con số trong bảng kế hoạch, thì ở GDG-HUST, mỗi người đều là một mảnh ghép không thể thay thế. Chính sự tỉ mỉ, sáng tạo và nụ cười của các bạn đã làm cho gia đình này ấm áp hơn mỗi ngày.

Mong rằng những trò chơi nho nhỏ, những món quà bất ngờ và những lời chúc trên cây ước nguyện đã mang lại cho bạn thật nhiều niềm vui. Nếu có điều gì chưa trọn vẹn, chúng mình xin hứa sẽ làm tốt hơn trong những lần tới.

Chúc bạn luôn xinh đẹp, rạng rỡ và khỏe mạnh; học tập, làm việc thật hiệu quả; và luôn giữ được ngọn lửa đam mê với những điều mình yêu thích. Hãy nhớ rằng, dù có bận rộn đến đâu, GDG-HUST vẫn luôn ở đây, sẵn sàng cùng bạn học hỏi, sáng tạo và lớn lên mỗi ngày.

Hẹn gặp lại bạn ở những sự kiện tiếp theo của GDG-HUST nhé!`;

function ThanksPage() {
  const [girl, setGirl] = useState<Girl | null>(null);

  // Girls logged in on this browser get their invitation stacked behind the thank-you letter.
  useEffect(() => {
    const token = localStorage.getItem("active_girl_token") || "";
    if (!token) return;
    const cached = dbService.getGirlByToken(token);
    if (cached) setGirl(cached);
    else dbService.loginGirl(token).then(setGirl);
  }, []);

  const name = girl?.name.trim() || "";

  return (
    <LetterSheet
      to={name}
      title="Thư cảm ơn"
      pages={
        girl
          ? [
              <>
                <p className="mb-5 text-center text-[21px] sm:text-[24px] leading-snug text-[#B4475A]">{INVITE_TITLE}</p>
                <p>{`Kính gửi ${name || "bạn"},`}</p>
                <div className="mt-4">{inviteBody(girl.name)}</div>
              </>,
              INVITE_PS,
            ]
          : []
      }
      footer={
        <p className="text-center text-xs text-[#826A73] border-t border-dashed border-[#D9C7B0] pt-6">
          Ghé{" "}
          <Link to="/boy" className="font-bold text-[#B4475A] bg-pink-100 px-1.5 py-0.5 rounded hover:bg-pink-200 no-underline">
            cây ước nguyện
          </Link>{" "}
          để đọc lại những lời chúc nhé.
        </p>
      }
    >
      {THANKS}
    </LetterSheet>
  );
}
