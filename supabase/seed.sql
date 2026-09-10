-- RayCert — Phase 10A demo seed (addendum §24).
--
-- Prerequisite (manual, one-time — profiles rows only ever come from the
-- auth.users -> profiles trigger, there is no signup UI yet in Phase 10A):
--   1. Supabase Dashboard -> Authentication -> Users -> Add User.
--   2. Give it any email/password you like (this is your own local/dev
--      Supabase project — not a production credential, and none is
--      hardcoded here).
--   3. The on_auth_user_created trigger (see the initial_schema migration)
--      creates a matching public.profiles row automatically.
-- Then run this file in the SQL Editor. It seeds against whichever
-- profiles row was created FIRST — no fake/hardcoded UUID, no guessed FK.
--
-- Contains no password, secret, or real email — sample content text only.

do $$
declare
  v_owner_id uuid;
  v_quiz_id uuid;
  v_quiz_question_id uuid;
  v_poll_question_id uuid;
  v_assessment_id uuid;
  v_assessment_question_1_id uuid;
  v_assessment_question_2_id uuid;
begin
  select id into v_owner_id from public.profiles order by created_at asc limit 1;

  if v_owner_id is null then
    raise exception
      'No profiles row found. Create a trainer user first via Supabase Dashboard -> Authentication -> Add User (this auto-creates a profiles row), then re-run this seed. See the comment at the top of this file.';
  end if;

  -- --- Quiz Library: one sample Quiz with a QUIZ question + a POLL question ---

  insert into public.quizzes (owner_id, title, description, status)
  values (v_owner_id, 'Compliance Refresher', 'Sample Live Quiz seeded by Phase 10A.', 'PUBLISHED')
  returning id into v_quiz_id;

  insert into public.questions (quiz_id, question_type, question_text, base_points, time_limit_seconds, display_order)
  values (v_quiz_id, 'QUIZ', 'Thông tin khách hàng cần được xử lý theo nguyên tắc nào?', 1000, 20, 1)
  returning id into v_quiz_question_id;

  insert into public.answer_options (question_id, option_text, display_order, is_correct)
  values
    (v_quiz_question_id, 'Bảo mật và đúng mục đích', 1, true),
    (v_quiz_question_id, 'Chia sẻ tự do nội bộ', 2, false),
    (v_quiz_question_id, 'Lưu vĩnh viễn mọi trường hợp', 3, false),
    (v_quiz_question_id, 'Không cần quy định', 4, false);

  insert into public.questions (quiz_id, question_type, question_text, base_points, time_limit_seconds, display_order)
  values (v_quiz_id, 'POLL', 'Bạn cảm thấy thế nào về khối lượng công việc tuần này?', 0, 15, 2)
  returning id into v_poll_question_id;

  insert into public.answer_options (question_id, option_text, display_order, is_correct)
  values
    (v_poll_question_id, 'Vừa sức', 1, false),
    (v_poll_question_id, 'Hơi nhiều', 2, false),
    (v_poll_question_id, 'Quá tải', 3, false);

  -- --- Assessment: one sample Post-test with 2 assessment_questions ---
  -- Mirrors mocks/assessments.ts's assessment-compliance-cert shape/points.

  insert into public.assessments (
    owner_id, title, company_name, description,
    minimum_passing_points, max_attempts, time_limit_minutes,
    randomize_questions, randomize_answers, show_correct_answers_after_submit, status
  )
  values (
    v_owner_id, 'Compliance Certification Test', 'Công ty TNHH ABC',
    'Bài kiểm tra bắt buộc sau khi hoàn thành khoá Compliance Refresher.',
    5, 2, 15, true, false, true, 'ACTIVE'
  )
  returning id into v_assessment_id;

  insert into public.assessment_questions (assessment_id, question_type, question_text, points, display_order)
  values (v_assessment_id, 'QUIZ', 'Thông tin khách hàng cần được xử lý theo nguyên tắc nào?', 2, 1)
  returning id into v_assessment_question_1_id;

  insert into public.assessment_answer_options (assessment_question_id, option_text, display_order, is_correct)
  values
    (v_assessment_question_1_id, 'Bảo mật và đúng mục đích', 1, true),
    (v_assessment_question_1_id, 'Chia sẻ tự do nội bộ', 2, false),
    (v_assessment_question_1_id, 'Lưu vĩnh viễn mọi trường hợp', 3, false),
    (v_assessment_question_1_id, 'Không cần quy định', 4, false);

  insert into public.assessment_questions (assessment_id, question_type, question_text, points, display_order)
  values (v_assessment_id, 'QUIZ', 'Mật khẩu hệ thống nội bộ nên được chia sẻ như thế nào?', 3, 2)
  returning id into v_assessment_question_2_id;

  insert into public.assessment_answer_options (assessment_question_id, option_text, display_order, is_correct)
  values
    (v_assessment_question_2_id, 'Không chia sẻ với bất kỳ ai', 1, true),
    (v_assessment_question_2_id, 'Chia sẻ qua chat nhóm', 2, false),
    (v_assessment_question_2_id, 'Ghi ra giấy dán màn hình', 3, false),
    (v_assessment_question_2_id, 'Gửi email cho cả phòng', 4, false);

  raise notice 'Seed complete — quiz_id=%, assessment_id=%', v_quiz_id, v_assessment_id;
end $$;
