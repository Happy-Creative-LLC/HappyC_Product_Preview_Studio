ALTER TABLE public.tasks ADD COLUMN sku varchar(100);

CREATE INDEX idx_tasks_project_sku ON public.tasks (project_id, sku);

CREATE TABLE public.task_events (
    id uuid PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    event_type varchar(100) NOT NULL,
    actor_id uuid NOT NULL REFERENCES public.users(id),
    detail jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_events_task_created ON public.task_events (task_id, created_at);

-- Các trường text mới nằm trong previews.product_data (JSONB), không cần cột riêng.
