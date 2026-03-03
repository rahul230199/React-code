--
-- PostgreSQL database dump
--

\restrict DtGwVu9JDafQL2y12P0w0AeOiGHpOjbcWUDsTadDaWyQgv5FGvt15Ai94g7Cf0Z

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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
-- Name: submit_network_request(character varying, character varying, text, character varying, character varying, character varying, character varying, character varying, jsonb, text, text, text, character varying, text, character varying, text, inet, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_network_request(p_company_name character varying, p_website character varying, p_registered_address text, p_city_state character varying, p_contact_name character varying, p_role character varying, p_email character varying, p_phone character varying, p_what_you_do jsonb, p_primary_product text, p_key_components text, p_manufacturing_locations text, p_monthly_capacity character varying, p_certifications text, p_role_in_ev character varying, p_why_join_axo text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id INTEGER;
BEGIN
    -- Insert the request
    INSERT INTO network_access_requests (
        company_name,
        website,
        registered_address,
        city_state,
        contact_name,
        role,
        email,
        phone,
        what_you_do,
        primary_product,
        key_components,
        manufacturing_locations,
        monthly_capacity,
        certifications,
        role_in_ev,
        why_join_axo,
        ip_address,
        user_agent
    ) VALUES (
        p_company_name,
        p_website,
        p_registered_address,
        p_city_state,
        p_contact_name,
        p_role,
        p_email,
        p_phone,
        p_what_you_do,
        p_primary_product,
        p_key_components,
        p_manufacturing_locations,
        p_monthly_capacity,
        p_certifications,
        p_role_in_ev,
        p_why_join_axo,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO new_id;
    
    -- Log the submission
    INSERT INTO request_audit_logs (request_id, changed_field, old_value, new_value)
    VALUES (new_id, 'status', NULL, 'pending');
    
    RETURN new_id;
END;
$$;


ALTER FUNCTION public.submit_network_request(p_company_name character varying, p_website character varying, p_registered_address text, p_city_state character varying, p_contact_name character varying, p_role character varying, p_email character varying, p_phone character varying, p_what_you_do jsonb, p_primary_product text, p_key_components text, p_manufacturing_locations text, p_monthly_capacity character varying, p_certifications text, p_role_in_ev character varying, p_why_join_axo text, p_ip_address inet, p_user_agent text) OWNER TO postgres;

--
-- Name: update_request_status(integer, character varying, text, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_request_status(p_request_id integer, p_new_status character varying, p_notes text DEFAULT NULL::text, p_verified_by character varying DEFAULT NULL::character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update the status
    UPDATE network_access_requests 
    SET status = p_new_status
    WHERE id = p_request_id;
    
    -- Log the status change
    INSERT INTO request_audit_logs (request_id, changed_field, old_value, new_value, changed_by)
    SELECT 
        p_request_id, 
        'status', 
        status, 
        p_new_status,
        COALESCE(p_verified_by, 'system')
    FROM network_access_requests 
    WHERE id = p_request_id;
    
    -- If verified, create verification record
    IF p_new_status = 'verified' AND p_verified_by IS NOT NULL THEN
        INSERT INTO verification_status (request_id, verified_by, verification_date, verification_method)
        VALUES (p_request_id, p_verified_by, CURRENT_TIMESTAMP, 'manual');
    END IF;
END;
$$;


ALTER FUNCTION public.update_request_status(p_request_id integer, p_new_status character varying, p_notes text, p_verified_by character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_logs (
    id integer NOT NULL,
    admin_user_id integer,
    action character varying(100) NOT NULL,
    target_user_id integer,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actor_role character varying(50),
    action_type character varying(100)
);


ALTER TABLE public.admin_audit_logs OWNER TO postgres;

--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_audit_logs_id_seq OWNER TO postgres;

--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_audit_logs_id_seq OWNED BY public.admin_audit_logs.id;


--
-- Name: network_access_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_access_requests (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    website character varying(255),
    registered_address text,
    city_state character varying(255) NOT NULL,
    contact_name character varying(255) NOT NULL,
    role_requested character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    what_you_do jsonb NOT NULL,
    primary_product text NOT NULL,
    key_components text NOT NULL,
    manufacturing_locations text NOT NULL,
    monthly_capacity character varying(100) NOT NULL,
    certifications text,
    role_in_ev character varying(50) NOT NULL,
    why_join_axo text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address inet,
    user_agent text,
    status character varying(20) DEFAULT 'pending'::character varying,
    verification_notes text,
    contact_role character varying(255),
    CONSTRAINT valid_email CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT valid_role_in_ev CHECK (((role_in_ev)::text = ANY ((ARRAY['OEMs'::character varying, 'Supplier'::character varying, 'Both'::character varying])::text[])))
);


ALTER TABLE public.network_access_requests OWNER TO postgres;

--
-- Name: capacity_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.capacity_summary AS
 SELECT EXTRACT(month FROM created_at) AS month,
    EXTRACT(year FROM created_at) AS year,
    sum(
        CASE
            WHEN ((monthly_capacity)::text ~ '(\d{1,3}(,\d{3})*)'::text) THEN (replace(split_part((monthly_capacity)::text, ' '::text, 1), ','::text, ''::text))::integer
            ELSE 0
        END) AS total_monthly_capacity
   FROM public.network_access_requests
  WHERE (monthly_capacity IS NOT NULL)
  GROUP BY (EXTRACT(year FROM created_at)), (EXTRACT(month FROM created_at))
  ORDER BY (EXTRACT(year FROM created_at)) DESC, (EXTRACT(month FROM created_at)) DESC;


ALTER VIEW public.capacity_summary OWNER TO postgres;

--
-- Name: company_statistics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.company_statistics AS
 SELECT city_state,
    count(*) AS total_requests,
    count(
        CASE
            WHEN ((status)::text = 'verified'::text) THEN 1
            ELSE NULL::integer
        END) AS verified_count,
    count(
        CASE
            WHEN ((status)::text = 'pending'::text) THEN 1
            ELSE NULL::integer
        END) AS pending_count,
    count(
        CASE
            WHEN (jsonb_array_length(what_you_do) > 1) THEN 1
            ELSE NULL::integer
        END) AS multi_service_companies
   FROM public.network_access_requests
  GROUP BY city_state
  ORDER BY (count(*)) DESC;


ALTER VIEW public.company_statistics OWNER TO postgres;

--
-- Name: network_access_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.network_access_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.network_access_requests_id_seq OWNER TO postgres;

--
-- Name: network_access_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.network_access_requests_id_seq OWNED BY public.network_access_requests.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    organization_id integer,
    title character varying(255),
    message text,
    type character varying(100),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    role_type character varying(20) NOT NULL,
    city_state character varying(100),
    primary_product character varying(255),
    monthly_capacity character varying(100),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    verified_at timestamp without time zone,
    verified_by integer,
    type character varying(20),
    CONSTRAINT organizations_type_check CHECK (((type)::text = ANY ((ARRAY['buyer'::character varying, 'supplier'::character varying])::text[])))
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_id_seq OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    po_id integer NOT NULL,
    amount numeric(14,2) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: pending_requests; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.pending_requests AS
 SELECT id,
    company_name,
    contact_name,
    email,
    phone,
    city_state,
    primary_product,
    created_at AS submission_timestamp
   FROM public.network_access_requests
  WHERE ((status)::text = 'pending'::text)
  ORDER BY created_at DESC;


ALTER VIEW public.pending_requests OWNER TO postgres;

--
-- Name: po_disputes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.po_disputes (
    id integer NOT NULL,
    purchase_order_id integer,
    raised_by integer,
    reason text NOT NULL,
    status character varying(50) DEFAULT 'open'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    po_id integer
);


ALTER TABLE public.po_disputes OWNER TO postgres;

--
-- Name: po_disputes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_disputes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.po_disputes_id_seq OWNER TO postgres;

--
-- Name: po_disputes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_disputes_id_seq OWNED BY public.po_disputes.id;


--
-- Name: po_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.po_events (
    id integer NOT NULL,
    po_id integer NOT NULL,
    event_type character varying(100) NOT NULL,
    event_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    CONSTRAINT po_events_event_type_check CHECK (((event_type)::text = ANY ((ARRAY['PO_ACCEPTED'::character varying, 'MILESTONE_UPDATED'::character varying, 'DELIVERY_CONFIRMED'::character varying, 'PAYMENT_CONFIRMED'::character varying, 'DISPUTE_RAISED'::character varying])::text[])))
);


ALTER TABLE public.po_events OWNER TO postgres;

--
-- Name: po_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.po_events_id_seq OWNER TO postgres;

--
-- Name: po_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_events_id_seq OWNED BY public.po_events.id;


--
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
-- Name: po_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.po_messages_id_seq OWNER TO postgres;

--
-- Name: po_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_messages_id_seq OWNED BY public.po_messages.id;


--
-- Name: po_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.po_milestones (
    id integer NOT NULL,
    po_id integer NOT NULL,
    milestone_name character varying(100) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT po_milestones_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'delayed'::character varying])::text[])))
);


ALTER TABLE public.po_milestones OWNER TO postgres;

--
-- Name: po_milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.po_milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.po_milestones_id_seq OWNER TO postgres;

--
-- Name: po_milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.po_milestones_id_seq OWNED BY public.po_milestones.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    rfq_id integer,
    buyer_org_id integer NOT NULL,
    supplier_org_id integer NOT NULL,
    part_name character varying(200) NOT NULL,
    quantity integer,
    value numeric(14,2),
    agreed_delivery_date date,
    payment_terms text,
    status character varying(30) DEFAULT 'issued'::character varying,
    accepted_at timestamp without time zone,
    actual_delivery_date date,
    dispute_flag boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_supplier_org_id integer,
    promised_delivery_date date,
    CONSTRAINT purchase_orders_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY ((ARRAY['issued'::character varying, 'accepted'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT purchase_orders_value_check CHECK ((value >= (0)::numeric))
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_id_seq OWNER TO postgres;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quotes_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT quotes_status_check CHECK (((status)::text = ANY ((ARRAY['submitted'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'withdrawn'::character varying])::text[]))),
    CONSTRAINT quotes_timeline_days_check CHECK ((timeline_days > 0))
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotes_id_seq OWNER TO postgres;

--
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;


--
-- Name: reliability_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reliability_scores (
    id integer NOT NULL,
    organization_id integer,
    final_score numeric(5,2) DEFAULT 0,
    total_orders integer DEFAULT 0,
    on_time_deliveries integer DEFAULT 0,
    disputes_count integer DEFAULT 0,
    last_calculated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reliability_scores OWNER TO postgres;

--
-- Name: reliability_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reliability_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reliability_scores_id_seq OWNER TO postgres;

--
-- Name: reliability_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reliability_scores_id_seq OWNED BY public.reliability_scores.id;


--
-- Name: rfq_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfq_files (
    id integer NOT NULL,
    rfq_id integer NOT NULL,
    file_name text,
    file_type text,
    file_url text,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rfq_files OWNER TO postgres;

--
-- Name: rfq_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfq_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfq_files_id_seq OWNER TO postgres;

--
-- Name: rfq_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfq_files_id_seq OWNED BY public.rfq_files.id;


--
-- Name: rfq_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfq_messages (
    id integer NOT NULL,
    rfq_id integer NOT NULL,
    sender_id integer NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rfq_messages OWNER TO postgres;

--
-- Name: rfq_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfq_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfq_messages_id_seq OWNER TO postgres;

--
-- Name: rfq_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfq_messages_id_seq OWNED BY public.rfq_messages.id;


--
-- Name: rfqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfqs (
    id integer NOT NULL,
    buyer_org_id integer NOT NULL,
    part_name character varying(200) NOT NULL,
    part_description text,
    quantity integer NOT NULL,
    ppap_level character varying(50),
    design_file_url text,
    status character varying(30) DEFAULT 'open'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    priority character varying(20) DEFAULT 'medium'::character varying,
    visibility_type character varying(20) DEFAULT 'public'::character varying,
    assigned_supplier_org_id integer,
    CONSTRAINT rfq_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying, 'awarded'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT rfqs_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT rfqs_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying, 'awarded'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.rfqs OWNER TO postgres;

--
-- Name: rfqs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfqs_id_seq OWNER TO postgres;

--
-- Name: rfqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfqs_id_seq OWNED BY public.rfqs.id;


--
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    organization_id integer,
    must_change_password boolean DEFAULT false,
    phone character varying(50),
    temp_password_generated_at timestamp without time zone,
    temporary_password text,
    is_deleted boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['buyer'::character varying, 'supplier'::character varying, 'both'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_audit_logs_id_seq'::regclass);


--
-- Name: network_access_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests ALTER COLUMN id SET DEFAULT nextval('public.network_access_requests_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: po_disputes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes ALTER COLUMN id SET DEFAULT nextval('public.po_disputes_id_seq'::regclass);


--
-- Name: po_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_events ALTER COLUMN id SET DEFAULT nextval('public.po_events_id_seq'::regclass);


--
-- Name: po_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_messages ALTER COLUMN id SET DEFAULT nextval('public.po_messages_id_seq'::regclass);


--
-- Name: po_milestones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_milestones ALTER COLUMN id SET DEFAULT nextval('public.po_milestones_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);


--
-- Name: reliability_scores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reliability_scores ALTER COLUMN id SET DEFAULT nextval('public.reliability_scores_id_seq'::regclass);


--
-- Name: rfq_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_files ALTER COLUMN id SET DEFAULT nextval('public.rfq_files_id_seq'::regclass);


--
-- Name: rfq_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_messages ALTER COLUMN id SET DEFAULT nextval('public.rfq_messages_id_seq'::regclass);


--
-- Name: rfqs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfqs ALTER COLUMN id SET DEFAULT nextval('public.rfqs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit_logs (id, admin_user_id, action, target_user_id, metadata, created_at, actor_role, action_type) FROM stdin;
\.


--
-- Data for Name: network_access_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.network_access_requests (id, company_name, website, registered_address, city_state, contact_name, role_requested, email, phone, what_you_do, primary_product, key_components, manufacturing_locations, monthly_capacity, certifications, role_in_ev, why_join_axo, created_at, ip_address, user_agent, status, verification_notes, contact_role) FROM stdin;
1	Auto Components Ltd	https://autocomponents.com	Sector 18, Industrial Area	Delhi, Delhi	Amit Patel	CEO	amit@autocomponents.com	+91 9123456789	["Manufacture EV components", "Provide manufacturing services"]	Chassis components	Suspension parts, Brake systems	Delhi, Gurgaon	8,000 units/month	ISO 9001, IATF 16949	Both	Looking to expand into EV components manufacturing	2026-01-27 16:02:08.377839	192.168.1.100	Mozilla/5.0 (Windows NT 10.0)	verified	\N	\N
2	Royal Enfield	https://royal.com	Bangalore	Bangalore	Royal	Manager	Royal.mech@gmail.con	89645842222	["Manufacture finished EVs"]	Lights	Light	Bangalore	500	9001	OEMs	NA	2026-01-28 05:40:39.375627	\N	\N	verified	\N	\N
3	AXO	https://axonetworks.com	bangalore	karnataka	rahul	manager	rahulsv@gmail.com	09192929292	["Manufacture finished EVs"]	Battery	Battery	Karnataka	3000	ISO	OEMs	NA	2026-01-28 08:04:26.147115	\N	\N	rejected	\N	\N
29	Google	Https:google.com	Bangalore	Karnataka	Anjeneya	qa	google@gmail.com	91919828281	["Manufacture finished EVs"]	Motors	Motors	Bangalore	899	ISO 9001	OEMs	NA	2026-02-17 14:21:42.492306	103.215.237.143	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	approved	Approved	\N
11	Version1	https:version.com	Bangalore	karnataka	Jilllu	Manager	jillu@gmail.com	8965546546	["Manufacture finished EVs", "Supply parts or materials"]	BBattery	Battery	Bangalore	10000	ISO	OEMs	NA	2026-01-29 15:43:18.369951	\N	\N	verified	\N	\N
26	Test	\N	\N	BLR	Rahul	Supplier	a@b.com	999	["Manufacturing"]	EV	Frame	India	100	\N	Supplier	Growth	2026-02-10 13:02:01.500318	::ffff:127.0.0.1	curl/8.11.1	verified	Approved	\N
25	Rahul	https://rahul.com	Bangalore	Karnataka	Rahul	manager	rah23019@gmail.com	82828282828	["Manufacture finished EVs"]	Battery	Battery	Bangalore	50`	ISO	OEMs	NA	2026-02-10 12:52:58.921955	49.249.50.230	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	verified	Approved	\N
19	TestCo	\N	\N	Bangalore	Rahul	Supplier	test@test.com	9999999999	["Manufacturing"]	EV Parts	Chassis	India	1000	\N	OEMs	Expand business	2026-02-10 12:38:57.275563	\N	\N	approved	Approved	\N
28	indiamart	https://indiamart.com	Bangalore	Bangalore	rocky	manager	rocky@gmail.com	+9189645842222	["Manufacture finished EVs"]	BBattery	Battery	Bangalore	10000	ISO	OEMs	NA	2026-02-17 07:43:55.443599	103.215.237.173	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	approved	Approved	\N
34	Hitachi	https://hitachi.com	bangalore	karnataka	akash	operator	hitachi123@gmail.com	86458216654	[]	Lights	Lights	bangalore	8999	ISO	Supplier	NA	2026-02-23 12:39:11.983468	103.215.237.226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	approved	Approved	\N
10	rahul	https:rahul.com	Banglore	Karnataka	Rahul sv	operator	rahul.sv@gmail.com	89643211222	["Manufacture EV components", "Supply parts or materials", "Provide manufacturing services"]	Motor	Battery	Bangalore	100000	ISO	Both	NA	2026-01-29 15:30:05.342184	\N	\N	verified	\N	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, organization_id, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, company_name, role_type, city_state, primary_product, monthly_capacity, status, created_at, verified_at, verified_by, type) FROM stdin;
6	TestCo	supplier	Bangalore	EV Parts	1000	active	2026-02-17 04:13:35.627663	2026-02-17 04:13:35.627663	34	\N
13	indiamart	manager	Bangalore	BBattery	10000	active	2026-02-17 08:02:27.045299	2026-02-17 08:02:27.045299	34	\N
14	Google	buyer	Karnataka	Motors	899	active	2026-02-17 14:22:01.250718	2026-02-17 14:22:01.250718	34	\N
15	Hitachi	operator	karnataka	Lights	8999	active	2026-02-23 12:39:29.000256	2026-02-23 12:39:29.000256	34	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, po_id, amount, status, paid_at, created_at) FROM stdin;
\.


--
-- Data for Name: po_disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.po_disputes (id, purchase_order_id, raised_by, reason, status, created_at, po_id) FROM stdin;
\.


--
-- Data for Name: po_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.po_events (id, po_id, event_type, event_timestamp, created_by) FROM stdin;
\.


--
-- Data for Name: po_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.po_messages (id, po_id, sender_id, message, created_at) FROM stdin;
\.


--
-- Data for Name: po_milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.po_milestones (id, po_id, milestone_name, status, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (id, po_number, rfq_id, buyer_org_id, supplier_org_id, part_name, quantity, value, agreed_delivery_date, payment_terms, status, accepted_at, actual_delivery_date, dispute_flag, created_at, assigned_supplier_org_id, promised_delivery_date) FROM stdin;
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotes (id, rfq_id, supplier_org_id, price, timeline_days, certifications, reliability_snapshot, status, created_at) FROM stdin;
\.


--
-- Data for Name: reliability_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reliability_scores (id, organization_id, final_score, total_orders, on_time_deliveries, disputes_count, last_calculated_at) FROM stdin;
\.


--
-- Data for Name: rfq_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfq_files (id, rfq_id, file_name, file_type, file_url, uploaded_at) FROM stdin;
4	8	aluminium_bracket_drawing.pdf	pdf	/uploads/rfqs/8/aluminium_bracket_drawing.pdf	2026-02-10 04:32:39.910986
5	8	aluminium_bracket.step	step	/uploads/rfqs/8/aluminium_bracket.step	2026-02-10 04:32:39.910986
6	9	steel_shaft_specs.pdf	pdf	/uploads/rfqs/9/steel_shaft_specs.pdf	2026-02-10 04:32:39.910986
\.


--
-- Data for Name: rfq_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfq_messages (id, rfq_id, sender_id, message, created_at) FROM stdin;
1	8	23	Please confirm if tooling cost is included.	2026-02-10 04:32:48.782382
2	8	27	Yes, tooling cost is included in the quoted price.	2026-02-10 04:32:48.782382
3	9	23	Can delivery be reduced to 6 weeks?	2026-02-10 04:32:48.782382
4	9	27	We can reduce to 6 weeks with a 3% price increase.	2026-02-10 04:32:48.782382
\.


--
-- Data for Name: rfqs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfqs (id, buyer_org_id, part_name, part_description, quantity, ppap_level, design_file_url, status, created_at, updated_at, priority, visibility_type, assigned_supplier_org_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, network_request_id, email, username, password_hash, role, status, created_at, last_login, organization_id, must_change_password, phone, temp_password_generated_at, temporary_password, is_deleted) FROM stdin;
29	1	amit.supplier@axonetworks.com	amit_supplier	$2b$10$2tjadsK8QM88wqRclv82lOpRN765FrQuKTAJzTSt12Z3/gA7sLylO	supplier	active	2026-01-29 16:36:50.65439	\N	\N	f	\N	\N	\N	f
229	26	a@b.com	a	$2b$10$YIgzueq4iE7lvYiFmDtF.eOCcUMSrs3RHDW.Pfq2g8Iazjl/OeFLC	supplier	active	2026-02-11 04:02:29.700508	\N	\N	f	\N	\N	\N	f
27	\N	prasanna.supplier@axonetworks.com	prasanna_supplier	$2b$10$/XKx.CkS778tTnCgtJfEkeQPkY57fuJZiCeCLljU9apiVcqVWD/LW	supplier	active	2026-01-29 16:36:42.654209	\N	\N	f	\N	\N	\N	f
241	34	hitachi123@gmail.com	hitachi123	$2b$12$Wl5EikCzRIU99MQvxkQRw.5frVmeu2cuuCiywVogq/JOTFGUHyhxq	supplier	active	2026-02-23 12:39:29.000256	\N	15	t	86458216654	\N	\N	f
232	19	test@test.com	test	$2b$10$fsV4iHnkkEyP11wQv.r7Hugrdsc5scLTizPuX0/qC25wId9m/c7p2	supplier	active	2026-02-17 04:13:35.627663	\N	6	t	9999999999	\N	\N	f
34	\N	admin@axonetworks.com	admin	$2b$10$ry6c1wyYYHLiIP0EMYy7jupGlPR69rTFa9akWXgrb0N4JywJ62mW6	admin	active	2026-02-07 06:54:06.184217	\N	\N	f	\N	\N	\N	f
239	28	rocky@gmail.com	rocky	$2b$10$Dn6L2aosdGIodnBeAoBU4.5foLF8PaqkOKG6qKTxedrRErVQvPKBS	supplier	active	2026-02-17 08:02:27.045299	\N	13	t	+9189645842222	\N	\N	f
240	29	google@gmail.com	google	$2b$10$lsUpo0eKPj/yDn5.TtqQSOKyf3GYZBbusB.91VUjNXLW8l4vhJ3Gy	buyer	active	2026-02-17 14:22:01.250718	\N	14	t	91919828281	\N	\N	f
23	\N	royal.mech.buyer@axonetworks.com	royal.mech	$2b$12$pYFP2cOGbETwC05hp6KH..a9EPLY8UXlnUy2B.fzXg4FXI3BG1P5e	buyer	active	2026-01-29 16:31:07.717492	\N	14	t	\N	\N	\N	f
31	\N	jillu.supplier@axonetworks.com	jillu_supplier	$2b$10$2OwV0Tx0xIUj70QGweU0BuOLq8ZXxqeBdb3XRY3MmFn4jrUUHnOI6	supplier	active	2026-01-30 12:41:25.735126	\N	6	f	\N	\N	\N	f
230	25	rah23019@gmail.com	rah23019	$2b$10$1tbcUCawI2.Erb1MN5EFVeER7Mz/ME9l.qcyjM2fOcWUXOlTigguy	buyer	active	2026-02-11 04:07:04.145624	\N	14	f	\N	\N	\N	f
26	\N	prasanna.buyer@axonetworks.com	prasanna_buyer	$2b$12$jV1qSBKByeEox/Qgz3tP/u7torJYysze.jWzR3SUBXtDYXfxFOxPC	buyer	active	2026-01-29 16:36:42.575274	\N	14	t	\N	\N	\N	f
30	\N	jillu.buyer@axonetworks.com	jillu_buyer	$2b$10$MiWC5imZmkz00gXTE90kcewE8DI5DJ7hsjQpuAlgi22nltcpctd2m	buyer	active	2026-01-30 12:41:25.656784	\N	14	f	\N	\N	\N	f
21	10	rahul.sv@axonetworks.com	rahul.sv	$2b$12$VvGbFEIXLcQGCjzoXrhBKurB0sy2zH13tcPFH8R2ec6IcwlCMDedS	buyer	active	2026-01-29 16:22:25.758536	\N	14	t	\N	\N	\N	f
231	\N	test2@test.com	test2	$2b$10$kNpkqo0oQLcEx6x/QTLlbumdKViv.rAEXKt7rCusZIdPR2d7foz8a	buyer	active	2026-02-11 11:00:02.004683	\N	14	f	\N	\N	\N	f
32	\N	rahul.sv.buyer@axonetworks.com	rahul.sv_buyer	$2b$10$Tmx.h7yBoahnbzQfJ3ncZO.QSq8nnFpzUt1Jz32B6fL9IDfBkqqnS	buyer	active	2026-01-30 14:28:21.826846	\N	14	f	\N	\N	\N	f
28	1	amit.buyer@axonetworks.com	amit_buyer	$2b$12$KIXQ4l8Q3o1yL9N7nq7rEuJfK5VYvR2j7gC9JmZp5oX9cJkYzYb6e	buyer	active	2026-01-29 16:36:50.57554	\N	14	f	\N	\N	\N	f
\.


--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_audit_logs_id_seq', 1, false);


--
-- Name: network_access_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.network_access_requests_id_seq', 34, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_id_seq', 15, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: po_disputes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.po_disputes_id_seq', 1, false);


--
-- Name: po_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.po_events_id_seq', 1, false);


--
-- Name: po_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.po_messages_id_seq', 1, false);


--
-- Name: po_milestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.po_milestones_id_seq', 1, false);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, false);


--
-- Name: quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotes_id_seq', 1, false);


--
-- Name: reliability_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reliability_scores_id_seq', 1, false);


--
-- Name: rfq_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfq_files_id_seq', 6, true);


--
-- Name: rfq_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfq_messages_id_seq', 4, true);


--
-- Name: rfqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfqs_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 241, true);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: network_access_requests network_access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_access_requests_pkey PRIMARY KEY (id);


--
-- Name: network_access_requests network_requests_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_requests_email_unique UNIQUE (email);


--
-- Name: network_access_requests network_requests_phone_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_access_requests
    ADD CONSTRAINT network_requests_phone_unique UNIQUE (phone);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: po_disputes po_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_pkey PRIMARY KEY (id);


--
-- Name: po_events po_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_events
    ADD CONSTRAINT po_events_pkey PRIMARY KEY (id);


--
-- Name: po_messages po_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_messages
    ADD CONSTRAINT po_messages_pkey PRIMARY KEY (id);


--
-- Name: po_milestones po_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_milestones
    ADD CONSTRAINT po_milestones_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: reliability_scores reliability_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reliability_scores
    ADD CONSTRAINT reliability_scores_pkey PRIMARY KEY (id);


--
-- Name: rfq_files rfq_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_files
    ADD CONSTRAINT rfq_files_pkey PRIMARY KEY (id);


--
-- Name: rfq_messages rfq_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_messages
    ADD CONSTRAINT rfq_messages_pkey PRIMARY KEY (id);


--
-- Name: rfqs rfqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfqs
    ADD CONSTRAINT rfqs_pkey PRIMARY KEY (id);


--
-- Name: quotes unique_supplier_quote; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT unique_supplier_quote UNIQUE (rfq_id, supplier_org_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_events_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_po ON public.po_events USING btree (po_id);


--
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_type ON public.po_events USING btree (event_type);


--
-- Name: idx_messages_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_po ON public.po_messages USING btree (po_id);


--
-- Name: idx_milestones_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_milestones_po ON public.po_milestones USING btree (po_id);


--
-- Name: idx_network_access_city_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_access_city_state ON public.network_access_requests USING btree (city_state);


--
-- Name: idx_network_access_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_access_company ON public.network_access_requests USING btree (company_name);


--
-- Name: idx_network_access_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_access_email ON public.network_access_requests USING btree (email);


--
-- Name: idx_network_access_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_access_status ON public.network_access_requests USING btree (status);


--
-- Name: idx_network_access_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_access_timestamp ON public.network_access_requests USING btree (created_at);


--
-- Name: idx_payments_po; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_po ON public.payments USING btree (po_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_po_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_po_buyer ON public.purchase_orders USING btree (buyer_org_id);


--
-- Name: idx_po_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_po_status ON public.purchase_orders USING btree (status);


--
-- Name: idx_po_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_po_supplier ON public.purchase_orders USING btree (supplier_org_id);


--
-- Name: idx_quotes_rfq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotes_rfq ON public.quotes USING btree (rfq_id);


--
-- Name: idx_quotes_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotes_supplier ON public.quotes USING btree (supplier_org_id);


--
-- Name: idx_rfqs_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfqs_buyer ON public.rfqs USING btree (buyer_org_id);


--
-- Name: idx_rfqs_buyer_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfqs_buyer_org ON public.rfqs USING btree (buyer_org_id);


--
-- Name: idx_rfqs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfqs_status ON public.rfqs USING btree (status);


--
-- Name: admin_audit_logs admin_audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: admin_audit_logs admin_audit_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: rfqs fk_rfq_buyer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfqs
    ADD CONSTRAINT fk_rfq_buyer FOREIGN KEY (buyer_org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: users fk_users_network_request; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_network_request FOREIGN KEY (network_request_id) REFERENCES public.network_access_requests(id) ON DELETE SET NULL;


--
-- Name: users fk_users_organization; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: users fk_users_request; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_request FOREIGN KEY (network_request_id) REFERENCES public.network_access_requests(id) ON DELETE SET NULL;


--
-- Name: organizations fk_verified_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT fk_verified_by FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: po_disputes po_disputes_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: po_disputes po_disputes_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: po_disputes po_disputes_raised_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_disputes
    ADD CONSTRAINT po_disputes_raised_by_fkey FOREIGN KEY (raised_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: po_events po_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_events
    ADD CONSTRAINT po_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: po_events po_events_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_events
    ADD CONSTRAINT po_events_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: po_messages po_messages_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_messages
    ADD CONSTRAINT po_messages_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: po_messages po_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_messages
    ADD CONSTRAINT po_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: po_milestones po_milestones_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.po_milestones
    ADD CONSTRAINT po_milestones_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_buyer_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_buyer_org_id_fkey FOREIGN KEY (buyer_org_id) REFERENCES public.organizations(id);


--
-- Name: purchase_orders purchase_orders_rfq_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_rfq_id_fkey FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id);


--
-- Name: purchase_orders purchase_orders_supplier_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_org_id_fkey FOREIGN KEY (supplier_org_id) REFERENCES public.organizations(id);


--
-- Name: quotes quotes_rfq_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_rfq_id_fkey FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_supplier_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_supplier_org_id_fkey FOREIGN KEY (supplier_org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: reliability_scores reliability_scores_supplier_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reliability_scores
    ADD CONSTRAINT reliability_scores_supplier_org_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: rfq_messages rfq_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_messages
    ADD CONSTRAINT rfq_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO axo_networks;


--
-- Name: TABLE admin_audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.admin_audit_logs TO axo_networks;


--
-- Name: TABLE network_access_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.network_access_requests TO axo_networks;


--
-- Name: TABLE capacity_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capacity_summary TO axo_networks;


--
-- Name: TABLE company_statistics; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.company_statistics TO axo_networks;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notifications TO axo_networks;


--
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organizations TO axo_networks;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payments TO axo_networks;


--
-- Name: TABLE pending_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pending_requests TO axo_networks;


--
-- Name: TABLE po_disputes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.po_disputes TO axo_networks;


--
-- Name: TABLE po_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.po_events TO axo_networks;


--
-- Name: TABLE po_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.po_messages TO axo_networks;


--
-- Name: TABLE po_milestones; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.po_milestones TO axo_networks;


--
-- Name: TABLE purchase_orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.purchase_orders TO axo_networks;


--
-- Name: TABLE quotes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.quotes TO axo_networks;


--
-- Name: TABLE reliability_scores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.reliability_scores TO axo_networks;


--
-- Name: TABLE rfq_files; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.rfq_files TO axo_networks;


--
-- Name: TABLE rfq_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.rfq_messages TO axo_networks;


--
-- Name: TABLE rfqs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.rfqs TO axo_networks;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO axo_networks;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO axo_networks;


--
-- PostgreSQL database dump complete
--

\unrestrict DtGwVu9JDafQL2y12P0w0AeOiGHpOjbcWUDsTadDaWyQgv5FGvt15Ai94g7Cf0Z

