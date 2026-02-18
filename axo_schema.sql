--
-- PostgreSQL database dump
--

\restrict OWE2C4OyxwO5PC2Gb6P1erEXIRlIPc0ju5UNbyX2RS2dhb2iuwpchf25dEhS8mm

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

-- Started on 2026-02-18 21:22:02

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3485 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 17497)
-- Name: network_access_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_access_requests (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    website character varying(255),
    registered_address text,
    city_state character varying(255) NOT NULL,
    contact_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    role_requested character varying(20) NOT NULL,
    what_you_do jsonb NOT NULL,
    primary_product text NOT NULL,
    key_components text NOT NULL,
    manufacturing_locations text NOT NULL,
    monthly_capacity character varying(100) NOT NULL,
    certifications text,
    role_in_ev character varying(50) NOT NULL,
    why_join_axo text NOT NULL,
    ip_address inet,
    user_agent text,
    status character varying(20) DEFAULT 'pending'::character varying,
    verification_notes text,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    CONSTRAINT network_access_requests_role_in_ev_check CHECK (((role_in_ev)::text = ANY ((ARRAY['OEMs'::character varying, 'Supplier'::character varying, 'Both'::character varying])::text[]))),
    CONSTRAINT network_access_requests_role_requested_check CHECK (((role_requested)::text = ANY ((ARRAY['buyer'::character varying, 'supplier'::character varying, 'oem'::character varying])::text[]))),
    CONSTRAINT network_access_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.network_access_requests OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 17496)
-- Name: network_access_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.network_access_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.network_access_requests_id_seq OWNER TO postgres;

--
-- TOC entry 3486 (class 0 OID 0)
-- Dependencies: 214
-- Name: network_access_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.network_access_requests_id_seq OWNED BY public.network_access_requests.id;


--
-- TOC entry 219 (class 1259 OID 17537)
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    role_type character varying(20) NOT NULL,
    city_state character varying(100),
    primary_product character varying(255),
    monthly_capacity character varying(100),
    status character varying(20) DEFAULT 'inactive'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    verified_at timestamp without time zone,
    verified_by integer,
    type character varying(20),
    CONSTRAINT organizations_type_check CHECK (((type)::text = ANY ((ARRAY['buyer'::character varying, 'supplier'::character varying])::text[])))
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 17536)
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organizations_id_seq OWNER TO postgres;

--
-- TOC entry 3487 (class 0 OID 0)
-- Dependencies: 218
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- TOC entry 233 (class 1259 OID 17694)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    po_id integer NOT NULL,
    amount numeric(14,2) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    milestone_id integer,
    paid_by_user_id integer,
    organization_id integer,
    metadata jsonb,
    CONSTRAINT valid_payment_status CHECK (((status)::text = ANY ((ARRAY['initiated'::character varying, 'paid'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17693)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payments_id_seq OWNER TO postgres;

--
-- TOC entry 3488 (class 0 OID 0)
-- Dependencies: 232
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 235 (class 1259 OID 17742)
-- Name: po_disputes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.po_disputes (
    id integer NOT NULL,
    po_id integer NOT NULL,
    raised_by_user_id integer NOT NULL,
    raised_by_role character varying(20) NOT NULL,
    organization_id integer NOT NULL,
    reason text NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    admin_resolution text,
    resolved_by_admin_id integer,
    created_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone,
    CONSTRAINT po_disputes_raised_by_role_check CHECK (((raised_by_role)::text = ANY ((ARRAY['buyer'::character varying, 'supplier'::character varying])::text[]))),
    CONSTRAINT po_disputes_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'resolved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.po_disputes OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17741)
-- Name: po_disputes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_disputes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.po_disputes_id_seq OWNER TO postgres;

--
-- TOC entry 3489 (class 0 OID 0)
-- Dependencies: 234
-- Name: po_disputes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_disputes_id_seq OWNED BY public.po_disputes.id;


--
-- TOC entry 229 (class 1259 OID 17656)
-- Name: po_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.po_events (
    id integer NOT NULL,
    po_id integer NOT NULL,
    event_type character varying(100) NOT NULL,
    event_timestamp timestamp without time zone DEFAULT now() NOT NULL,
    actor_user_id integer NOT NULL,
    description text,
    organization_id integer,
    actor_role character varying(50),
    metadata jsonb,
    CONSTRAINT valid_actor_role CHECK (((actor_role)::text = ANY ((ARRAY['buyer'::character varying, 'supplier'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.po_events OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17655)
-- Name: po_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.po_events_id_seq OWNER TO postgres;

--
-- TOC entry 3490 (class 0 OID 0)
-- Dependencies: 228
-- Name: po_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_events_id_seq OWNED BY public.po_events.id;


--
-- TOC entry 231 (class 1259 OID 17674)
-- Name: po_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.po_messages (
    id integer NOT NULL,
    po_id integer NOT NULL,
    sender_id integer NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.po_messages OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17673)
-- Name: po_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.po_messages_id_seq OWNER TO postgres;

--
-- TOC entry 3491 (class 0 OID 0)
-- Dependencies: 230
-- Name: po_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_messages_id_seq OWNED BY public.po_messages.id;


--
-- TOC entry 227 (class 1259 OID 17642)
-- Name: po_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.po_milestones (
    id integer NOT NULL,
    po_id integer NOT NULL,
    milestone_name character varying(100) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sequence_order integer,
    due_date date,
    completed_at timestamp without time zone,
    evidence_url text,
    remarks text,
    CONSTRAINT valid_milestone_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.po_milestones OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17641)
-- Name: po_milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.po_milestones_id_seq OWNER TO postgres;

--
-- TOC entry 3492 (class 0 OID 0)
-- Dependencies: 226
-- Name: po_milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_milestones_id_seq OWNED BY public.po_milestones.id;


--
-- TOC entry 225 (class 1259 OID 17613)
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    rfq_id integer,
    buyer_org_id integer NOT NULL,
    supplier_org_id integer NOT NULL,
    part_name character varying(200),
    quantity integer,
    value numeric(14,2),
    agreed_delivery_date date,
    payment_terms text,
    status character varying(30) DEFAULT 'issued'::character varying,
    accepted_at timestamp without time zone,
    actual_delivery_date date,
    dispute_flag boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quote_id integer,
    promised_delivery_date date,
    CONSTRAINT valid_po_status CHECK (((status)::text = ANY ((ARRAY['issued'::character varying, 'accepted'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'disputed'::character varying])::text[])))
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17612)
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_orders_id_seq OWNER TO postgres;

--
-- TOC entry 3493 (class 0 OID 0)
-- Dependencies: 224
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- TOC entry 223 (class 1259 OID 17590)
-- Name: quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotes (
    id integer NOT NULL,
    rfq_id integer NOT NULL,
    supplier_org_id integer NOT NULL,
    price numeric(12,2) NOT NULL,
    timeline_days integer,
    certifications text,
    reliability_snapshot integer,
    status character varying(30) DEFAULT 'submitted'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17589)
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quotes_id_seq OWNER TO postgres;

--
-- TOC entry 3494 (class 0 OID 0)
-- Dependencies: 222
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;


--
-- TOC entry 221 (class 1259 OID 17574)
-- Name: rfqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfqs (
    id integer NOT NULL,
    buyer_org_id integer NOT NULL,
    part_name character varying(200),
    part_description text,
    quantity integer NOT NULL,
    ppap_level character varying(50),
    design_file_url text,
    status character varying(30) DEFAULT 'open'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rfq_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying, 'awarded'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.rfqs OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17573)
-- Name: rfqs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rfqs_id_seq OWNER TO postgres;

--
-- TOC entry 3495 (class 0 OID 0)
-- Dependencies: 220
-- Name: rfqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfqs_id_seq OWNED BY public.rfqs.id;


--
-- TOC entry 217 (class 1259 OID 17515)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    network_request_id integer,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    must_change_password boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    organization_id integer,
    phone character varying(20),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'buyer'::character varying, 'supplier'::character varying, 'both'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 17514)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3496 (class 0 OID 0)
-- Dependencies: 216
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3223 (class 2604 OID 17500)
-- Name: network_access_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests ALTER COLUMN id SET DEFAULT nextval('public.network_access_requests_id_seq'::regclass);


--
-- TOC entry 3231 (class 2604 OID 17540)
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- TOC entry 3252 (class 2604 OID 17697)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 3255 (class 2604 OID 17745)
-- Name: po_disputes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes ALTER COLUMN id SET DEFAULT nextval('public.po_disputes_id_seq'::regclass);


--
-- TOC entry 3248 (class 2604 OID 17659)
-- Name: po_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_events ALTER COLUMN id SET DEFAULT nextval('public.po_events_id_seq'::regclass);


--
-- TOC entry 3250 (class 2604 OID 17677)
-- Name: po_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_messages ALTER COLUMN id SET DEFAULT nextval('public.po_messages_id_seq'::regclass);


--
-- TOC entry 3245 (class 2604 OID 17645)
-- Name: po_milestones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_milestones ALTER COLUMN id SET DEFAULT nextval('public.po_milestones_id_seq'::regclass);


--
-- TOC entry 3241 (class 2604 OID 17616)
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- TOC entry 3238 (class 2604 OID 17593)
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);


--
-- TOC entry 3234 (class 2604 OID 17577)
-- Name: rfqs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfqs ALTER COLUMN id SET DEFAULT nextval('public.rfqs_id_seq'::regclass);


--
-- TOC entry 3227 (class 2604 OID 17518)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3276 (class 2606 OID 17509)
-- Name: network_access_requests network_access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_access_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3278 (class 2606 OID 17567)
-- Name: network_access_requests network_requests_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_requests_email_unique UNIQUE (email);


--
-- TOC entry 3280 (class 2606 OID 17569)
-- Name: network_access_requests network_requests_phone_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_requests_phone_unique UNIQUE (phone);


--
-- TOC entry 3290 (class 2606 OID 17546)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 3311 (class 2606 OID 17701)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3315 (class 2606 OID 17753)
-- Name: po_disputes po_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_pkey PRIMARY KEY (id);


--
-- TOC entry 3307 (class 2606 OID 17662)
-- Name: po_events po_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_events
    ADD CONSTRAINT po_events_pkey PRIMARY KEY (id);


--
-- TOC entry 3309 (class 2606 OID 17682)
-- Name: po_messages po_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_messages
    ADD CONSTRAINT po_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3303 (class 2606 OID 17649)
-- Name: po_milestones po_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_milestones
    ADD CONSTRAINT po_milestones_pkey PRIMARY KEY (id);


--
-- TOC entry 3299 (class 2606 OID 17623)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3301 (class 2606 OID 17625)
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- TOC entry 3295 (class 2606 OID 17599)
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- TOC entry 3293 (class 2606 OID 17583)
-- Name: rfqs rfqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfqs
    ADD CONSTRAINT rfqs_pkey PRIMARY KEY (id);


--
-- TOC entry 3313 (class 2606 OID 17739)
-- Name: payments unique_milestone_payment; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT unique_milestone_payment UNIQUE (milestone_id);


--
-- TOC entry 3305 (class 2606 OID 17722)
-- Name: po_milestones unique_po_sequence; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_milestones
    ADD CONSTRAINT unique_po_sequence UNIQUE (po_id, sequence_order);


--
-- TOC entry 3297 (class 2606 OID 17601)
-- Name: quotes unique_supplier_quote; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT unique_supplier_quote UNIQUE (rfq_id, supplier_org_id);


--
-- TOC entry 3282 (class 2606 OID 17529)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3284 (class 2606 OID 17571)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3286 (class 2606 OID 17565)
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- TOC entry 3288 (class 2606 OID 17527)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3271 (class 1259 OID 17512)
-- Name: idx_network_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_city ON public.network_access_requests USING btree (city_state);


--
-- TOC entry 3272 (class 1259 OID 17510)
-- Name: idx_network_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_email ON public.network_access_requests USING btree (email);


--
-- TOC entry 3273 (class 1259 OID 17511)
-- Name: idx_network_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_status ON public.network_access_requests USING btree (status);


--
-- TOC entry 3274 (class 1259 OID 17513)
-- Name: idx_network_submitted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_submitted ON public.network_access_requests USING btree (submitted_at);


--
-- TOC entry 3291 (class 1259 OID 17710)
-- Name: idx_rfqs_buyer_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfqs_buyer_org ON public.rfqs USING btree (buyer_org_id);


--
-- TOC entry 3322 (class 2606 OID 17711)
-- Name: purchase_orders fk_po_quote; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_po_quote FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;


--
-- TOC entry 3319 (class 2606 OID 17584)
-- Name: rfqs fk_rfq_buyer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfqs
    ADD CONSTRAINT fk_rfq_buyer FOREIGN KEY (buyer_org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 3318 (class 2606 OID 17547)
-- Name: organizations organizations_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- TOC entry 3331 (class 2606 OID 17728)
-- Name: payments payments_milestone_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_milestone_fk FOREIGN KEY (milestone_id) REFERENCES public.po_milestones(id);


--
-- TOC entry 3332 (class 2606 OID 17702)
-- Name: payments payments_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3333 (class 2606 OID 17733)
-- Name: payments payments_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_fk FOREIGN KEY (paid_by_user_id) REFERENCES public.users(id);


--
-- TOC entry 3334 (class 2606 OID 17764)
-- Name: po_disputes po_disputes_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3335 (class 2606 OID 17754)
-- Name: po_disputes po_disputes_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3336 (class 2606 OID 17759)
-- Name: po_disputes po_disputes_raised_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_raised_by_user_id_fkey FOREIGN KEY (raised_by_user_id) REFERENCES public.users(id);


--
-- TOC entry 3337 (class 2606 OID 17769)
-- Name: po_disputes po_disputes_resolved_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_resolved_by_admin_id_fkey FOREIGN KEY (resolved_by_admin_id) REFERENCES public.users(id);


--
-- TOC entry 3327 (class 2606 OID 17668)
-- Name: po_events po_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_events
    ADD CONSTRAINT po_events_created_by_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3328 (class 2606 OID 17663)
-- Name: po_events po_events_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_events
    ADD CONSTRAINT po_events_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3329 (class 2606 OID 17683)
-- Name: po_messages po_messages_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_messages
    ADD CONSTRAINT po_messages_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3330 (class 2606 OID 17688)
-- Name: po_messages po_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_messages
    ADD CONSTRAINT po_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3326 (class 2606 OID 17650)
-- Name: po_milestones po_milestones_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_milestones
    ADD CONSTRAINT po_milestones_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3323 (class 2606 OID 17631)
-- Name: purchase_orders purchase_orders_buyer_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_buyer_org_id_fkey FOREIGN KEY (buyer_org_id) REFERENCES public.organizations(id);


--
-- TOC entry 3324 (class 2606 OID 17626)
-- Name: purchase_orders purchase_orders_rfq_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_rfq_id_fkey FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id);


--
-- TOC entry 3325 (class 2606 OID 17636)
-- Name: purchase_orders purchase_orders_supplier_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_org_id_fkey FOREIGN KEY (supplier_org_id) REFERENCES public.organizations(id);


--
-- TOC entry 3320 (class 2606 OID 17602)
-- Name: quotes quotes_rfq_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_rfq_id_fkey FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id) ON DELETE CASCADE;


--
-- TOC entry 3321 (class 2606 OID 17607)
-- Name: quotes quotes_supplier_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_supplier_org_id_fkey FOREIGN KEY (supplier_org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 3316 (class 2606 OID 17530)
-- Name: users users_network_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_network_request_id_fkey FOREIGN KEY (network_request_id) REFERENCES public.network_access_requests(id) ON DELETE SET NULL;


--
-- TOC entry 3317 (class 2606 OID 17552)
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


-- Completed on 2026-02-18 21:22:03

--
-- PostgreSQL database dump complete
--

\unrestrict OWE2C4OyxwO5PC2Gb6P1erEXIRlIPc0ju5UNbyX2RS2dhb2iuwpchf25dEhS8mm

