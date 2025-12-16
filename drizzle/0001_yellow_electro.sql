CREATE TABLE "taxRegimes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(3) NOT NULL,
	"description" varchar(256) NOT NULL,
	CONSTRAINT "taxRegimes_code_unique" UNIQUE("code")
);
