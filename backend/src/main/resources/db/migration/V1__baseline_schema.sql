-- V1: baseline schema.
--
-- Khớp schema mà các entity JPA hiện tại sinh ra (cùng bảng, cột, kiểu, NOT NULL),
-- cộng thêm default, CHECK, FK ON DELETE CASCADE, index và trigger updated_at đang có trên DB dev
-- (nguồn gốc: database/init.sql cũ). DB dev đã tồn tại được Flyway baseline ở V1 nên không chạy lại file này.
-- Không sửa file này sau khi đã chạy ở bất kỳ môi trường nào; thay đổi schema mới đi vào V2, V3, ...

--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    preview_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    author_role character varying(255) NOT NULL,
    target_component character varying(255) DEFAULT 'GENERAL'::character varying NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL,
    resolved_by uuid,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT comments_target_component_check CHECK (((target_component)::text = ANY (ARRAY[('IMAGE'::character varying)::text, ('VIDEO'::character varying)::text, ('TEXT'::character varying)::text, ('APLUS'::character varying)::text, ('GENERAL'::character varying)::text])))
);

--
-- Name: previews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.previews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid,
    user_id uuid NOT NULL,
    platform character varying(255) DEFAULT 'AMAZON'::character varying NOT NULL,
    product_data jsonb,
    status character varying(255) DEFAULT 'DRAFT'::character varying NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT previews_status_check CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('SUBMITTED'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text])))
);

--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_key character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_project_key_check CHECK (((project_key)::text = ANY (ARRAY[('happy'::character varying)::text, ('creative'::character varying)::text, ('hapify84'::character varying)::text, ('global'::character varying)::text])))
);

--
-- Name: search_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_cache (
    id bigint NOT NULL,
    keyword character varying(255) NOT NULL,
    results_json jsonb NOT NULL,
    last_updated timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: search_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.search_cache_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: search_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.search_cache_id_seq OWNED BY public.search_cache.id;

--
-- Name: stored_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stored_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    object_key character varying(500) NOT NULL,
    original_filename character varying(255),
    content_type character varying(150),
    size_bytes bigint NOT NULL,
    data bytea NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    created_by uuid NOT NULL,
    title character varying(255) NOT NULL,
    platform character varying(255) DEFAULT 'AMAZON'::character varying NOT NULL,
    category integer DEFAULT 1 NOT NULL,
    status character varying(255) DEFAULT 'PENDING_UPLOADS'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tasks_category_check CHECK ((category = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT tasks_platform_check CHECK (((platform)::text = ANY (ARRAY[('AMAZON'::character varying)::text, ('ETSY'::character varying)::text]))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING_UPLOADS'::character varying)::text, ('IN_REVIEW'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text])))
);

--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255),
    password_hash character varying(255),
    full_name character varying(255),
    avatar_url character varying(255),
    role character varying(255) DEFAULT 'SELLER'::character varying NOT NULL,
    project_key character varying(255),
    auth_provider character varying(255) DEFAULT 'LOCAL'::character varying NOT NULL,
    google_sub character varying(255),
    status character varying(255) DEFAULT 'ACTIVE'::character varying NOT NULL,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_auth_provider_check CHECK (((auth_provider)::text = ANY (ARRAY[('LOCAL'::character varying)::text, ('GOOGLE'::character varying)::text]))),
    CONSTRAINT users_project_key_check CHECK (((project_key)::text = ANY (ARRAY[('happy'::character varying)::text, ('creative'::character varying)::text, ('hapify84'::character varying)::text, ('global'::character varying)::text]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('ADMIN'::character varying)::text, ('MARVEL'::character varying)::text, ('SELLER'::character varying)::text, ('PRODUCT_DESIGN'::character varying)::text]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('ACTIVE'::character varying)::text, ('LOCKED'::character varying)::text])))
);

--
-- Name: search_cache id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_cache ALTER COLUMN id SET DEFAULT nextval('public.search_cache_id_seq'::regclass);

--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);

--
-- Name: previews previews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.previews
    ADD CONSTRAINT previews_pkey PRIMARY KEY (id);

--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

--
-- Name: projects projects_project_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_key_key UNIQUE (project_key);

--
-- Name: search_cache search_cache_keyword_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_cache
    ADD CONSTRAINT search_cache_keyword_key UNIQUE (keyword);

--
-- Name: search_cache search_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_cache
    ADD CONSTRAINT search_cache_pkey PRIMARY KEY (id);

--
-- Name: stored_files stored_files_object_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stored_files
    ADD CONSTRAINT stored_files_object_key_key UNIQUE (object_key);

--
-- Name: stored_files stored_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stored_files
    ADD CONSTRAINT stored_files_pkey PRIMARY KEY (id);

--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);

--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

--
-- Name: users users_google_sub_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_sub_key UNIQUE (google_sub);

--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);

--
-- Name: idx_comments_preview; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_preview ON public.comments USING btree (preview_id);

--
-- Name: idx_previews_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_previews_gin ON public.previews USING gin (product_data);

--
-- Name: idx_previews_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_previews_task_id ON public.previews USING btree (task_id);

--
-- Name: idx_stored_files_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stored_files_created ON public.stored_files USING btree (created_at);

--
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);

--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);

--
-- Name: idx_users_project_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_project_key ON public.users USING btree (project_key);

--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_status ON public.users USING btree (status);

--
-- Name: previews trg_previews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_previews_updated_at BEFORE UPDATE ON public.previews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

--
-- Name: tasks trg_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

--
-- Name: comments comments_preview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_preview_id_fkey FOREIGN KEY (preview_id) REFERENCES public.previews(id) ON DELETE CASCADE;

--
-- Name: comments comments_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);

--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: previews previews_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.previews
    ADD CONSTRAINT previews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

--
-- Name: previews previews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.previews
    ADD CONSTRAINT previews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

--
--
