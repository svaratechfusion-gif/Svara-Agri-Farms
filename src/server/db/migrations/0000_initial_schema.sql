CREATE TYPE "public"."admin_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TYPE "public"."availability" AS ENUM('available', 'coming-soon', 'sold-out');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('INR');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_reason" AS ENUM('reserve', 'release', 'fulfil', 'adjust');--> statement-breakpoint
CREATE TYPE "public"."order_request_status" AS ENUM('pending-confirmation', 'confirmed', 'dispatched', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('not-collected');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" NOT NULL,
	"disabled_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_normalised" CHECK ("admin_users"."email" = lower(btrim("admin_users"."email"))),
	CONSTRAINT "admin_users_email_shape" CHECK ("admin_users"."email" LIKE '_%@_%'),
	CONSTRAINT "admin_users_password_hash_present" CHECK (length("admin_users"."password_hash") > 0)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_format" CHECK ("customers"."phone" ~ '^\+91[6-9][0-9]{9}$'),
	CONSTRAINT "customers_full_name_present" CHECK (length(btrim("customers"."full_name")) > 0),
	CONSTRAINT "customers_email_shape" CHECK ("customers"."email" IS NULL OR "customers"."email" LIKE '_%@_%')
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"variant_id" text PRIMARY KEY NOT NULL,
	"on_hand" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_on_hand_non_negative" CHECK ("inventory"."on_hand" >= 0),
	CONSTRAINT "inventory_reserved_non_negative" CHECK ("inventory"."reserved" >= 0),
	CONSTRAINT "inventory_reserved_within_on_hand" CHECK ("inventory"."reserved" <= "inventory"."on_hand")
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" "inventory_movement_reason" NOT NULL,
	"order_request_id" uuid,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_movements_delta_non_zero" CHECK ("inventory_movements"."delta" <> 0),
	CONSTRAINT "inventory_movements_delta_direction" CHECK (("inventory_movements"."reason" = 'reserve' AND "inventory_movements"."delta" > 0) OR ("inventory_movements"."reason" IN ('release', 'fulfil') AND "inventory_movements"."delta" < 0) OR "inventory_movements"."reason" = 'adjust'),
	CONSTRAINT "inventory_movements_order_link" CHECK ("inventory_movements"."reason" = 'adjust' OR "inventory_movements"."order_request_id" IS NOT NULL),
	CONSTRAINT "inventory_movements_actor_present" CHECK (length(btrim("inventory_movements"."actor")) > 0)
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_request_id" uuid NOT NULL,
	"from_status" "order_request_status",
	"to_status" "order_request_status" NOT NULL,
	"actor" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_events_actor_present" CHECK (length(btrim("order_events"."actor")) > 0)
);
--> statement-breakpoint
CREATE TABLE "order_request_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_request_id" uuid NOT NULL,
	"variant_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"size_label_snapshot" text NOT NULL,
	CONSTRAINT "order_request_lines_order_variant_key" UNIQUE("order_request_id","variant_id"),
	CONSTRAINT "order_request_lines_quantity_range" CHECK ("order_request_lines"."quantity" BETWEEN 1 AND 10),
	CONSTRAINT "order_request_lines_unit_price_positive" CHECK ("order_request_lines"."unit_price_minor" > 0),
	CONSTRAINT "order_request_lines_snapshots_present" CHECK (length(btrim("order_request_lines"."product_name_snapshot")) > 0 AND length(btrim("order_request_lines"."size_label_snapshot")) > 0)
);
--> statement-breakpoint
CREATE TABLE "order_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"delivery_address" jsonb NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"currency" "currency" DEFAULT 'INR' NOT NULL,
	"status" "order_request_status" DEFAULT 'pending-confirmation' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'not-collected' NOT NULL,
	"submission_key_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_requests_reference_format" CHECK ("order_requests"."reference" ~ '^SVF-\d{6}-[2-9A-HJKMNP-Z]{6}$'),
	CONSTRAINT "order_requests_submission_key_hash_format" CHECK ("order_requests"."submission_key_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "order_requests_subtotal_positive" CHECK ("order_requests"."subtotal_minor" > 0),
	CONSTRAINT "order_requests_delivery_address_object" CHECK (jsonb_typeof("order_requests"."delivery_address") = 'object')
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_slug" text NOT NULL,
	"price_minor" integer,
	"currency" "currency" DEFAULT 'INR' NOT NULL,
	"availability" "availability" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "product_variants_id_format" CHECK ("product_variants"."id" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "product_variants_product_slug_format" CHECK ("product_variants"."product_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "product_variants_price_positive" CHECK ("product_variants"."price_minor" IS NULL OR "product_variants"."price_minor" > 0),
	CONSTRAINT "product_variants_available_requires_price" CHECK ("product_variants"."availability" <> 'available' OR "product_variants"."price_minor" IS NOT NULL),
	CONSTRAINT "product_variants_updated_by_present" CHECK (length(btrim("product_variants"."updated_by")) > 0)
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limits_pkey" PRIMARY KEY("key","window_start"),
	CONSTRAINT "rate_limits_count_positive" CHECK ("rate_limits"."count" > 0)
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_request_id_order_requests_id_fk" FOREIGN KEY ("order_request_id") REFERENCES "public"."order_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_request_id_order_requests_id_fk" FOREIGN KEY ("order_request_id") REFERENCES "public"."order_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_request_lines" ADD CONSTRAINT "order_request_lines_order_request_id_order_requests_id_fk" FOREIGN KEY ("order_request_id") REFERENCES "public"."order_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_request_lines" ADD CONSTRAINT "order_request_lines_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_requests" ADD CONSTRAINT "order_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_phone_key" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "inventory_movements_variant_id_created_at_idx" ON "inventory_movements" USING btree ("variant_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_order_request_id_idx" ON "inventory_movements" USING btree ("order_request_id");--> statement-breakpoint
CREATE INDEX "order_events_order_request_id_created_at_idx" ON "order_events" USING btree ("order_request_id","created_at");--> statement-breakpoint
CREATE INDEX "order_request_lines_variant_id_idx" ON "order_request_lines" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_requests_reference_key" ON "order_requests" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "order_requests_submission_key_hash_key" ON "order_requests" USING btree ("submission_key_hash");--> statement-breakpoint
CREATE INDEX "order_requests_customer_id_idx" ON "order_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "order_requests_status_created_at_idx" ON "order_requests" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "order_requests_created_at_idx" ON "order_requests" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "product_variants_product_slug_idx" ON "product_variants" USING btree ("product_slug");--> statement-breakpoint
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");