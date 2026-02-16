--
-- PostgreSQL database dump
--

\restrict 6GnEIJFXoYDargfJajF5VQl5ca4JC8NbGJdGSLbZmvNJka8TY7M1I1nTX1hlxjC

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

-- Started on 2026-02-16 13:52:40

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
-- TOC entry 3366 (class 0 OID 0)
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
    verified_by integer
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
-- TOC entry 3367 (class 0 OID 0)
-- Dependencies: 218
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


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
-- TOC entry 3368 (class 0 OID 0)
-- Dependencies: 216
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3180 (class 2604 OID 17500)
-- Name: network_access_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests ALTER COLUMN id SET DEFAULT nextval('public.network_access_requests_id_seq'::regclass);


--
-- TOC entry 3188 (class 2604 OID 17540)
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- TOC entry 3184 (class 2604 OID 17518)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3201 (class 2606 OID 17509)
-- Name: network_access_requests network_access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_access_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3203 (class 2606 OID 17567)
-- Name: network_access_requests network_requests_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_requests_email_unique UNIQUE (email);


--
-- TOC entry 3205 (class 2606 OID 17569)
-- Name: network_access_requests network_requests_phone_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_requests_phone_unique UNIQUE (phone);


--
-- TOC entry 3215 (class 2606 OID 17546)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 3207 (class 2606 OID 17529)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3209 (class 2606 OID 17571)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3211 (class 2606 OID 17565)
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- TOC entry 3213 (class 2606 OID 17527)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3196 (class 1259 OID 17512)
-- Name: idx_network_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_city ON public.network_access_requests USING btree (city_state);


--
-- TOC entry 3197 (class 1259 OID 17510)
-- Name: idx_network_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_email ON public.network_access_requests USING btree (email);


--
-- TOC entry 3198 (class 1259 OID 17511)
-- Name: idx_network_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_status ON public.network_access_requests USING btree (status);


--
-- TOC entry 3199 (class 1259 OID 17513)
-- Name: idx_network_submitted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_submitted ON public.network_access_requests USING btree (submitted_at);


--
-- TOC entry 3218 (class 2606 OID 17547)
-- Name: organizations organizations_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- TOC entry 3216 (class 2606 OID 17530)
-- Name: users users_network_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_network_request_id_fkey FOREIGN KEY (network_request_id) REFERENCES public.network_access_requests(id) ON DELETE SET NULL;


--
-- TOC entry 3217 (class 2606 OID 17552)
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


-- Completed on 2026-02-16 13:52:41

--
-- PostgreSQL database dump complete
--

\unrestrict 6GnEIJFXoYDargfJajF5VQl5ca4JC8NbGJdGSLbZmvNJka8TY7M1I1nTX1hlxjC

