ALTER TABLE public.comments
    ADD COLUMN task_id uuid,
    ADD COLUMN parent_comment_id uuid;

UPDATE public.comments c
SET task_id = p.task_id
FROM public.previews p
WHERE p.id = c.preview_id
  AND p.task_id IS NOT NULL;

ALTER TABLE public.comments
    ALTER COLUMN preview_id DROP NOT NULL,
    RENAME COLUMN target_component TO audience;

ALTER TABLE public.comments
    DROP CONSTRAINT comments_target_component_check;

UPDATE public.comments
SET audience = 'TASK';

ALTER TABLE public.comments
    ALTER COLUMN audience SET DEFAULT 'TASK',
    ADD CONSTRAINT comments_audience_check CHECK (audience = 'TASK'),
    ADD CONSTRAINT comments_task_fk FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
    ADD CONSTRAINT comments_parent_fk FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX idx_comments_task_created ON public.comments (task_id, created_at);
CREATE INDEX idx_comments_parent ON public.comments (parent_comment_id);

CREATE TABLE public.comment_mentions (
    comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, user_id)
);
