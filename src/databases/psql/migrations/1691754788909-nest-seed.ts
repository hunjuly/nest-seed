import { MigrationInterface, QueryRunner } from 'typeorm'

export class NestSeed1691754788909 implements MigrationInterface {
    name = 'NestSeed1691754788909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "nest_schema"."seed" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "name" character varying NOT NULL, "desc" text NOT NULL, "integer" integer NOT NULL, "enums" character varying array NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_e959d094217adb4d796a027d2c8" PRIMARY KEY ("id"))`
        )
        await queryRunner.query(
            `CREATE TABLE "nest_schema"."user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "birthdate" TIMESTAMP WITH TIME ZONE NOT NULL, "username" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "nest_schema"."user"`)
        await queryRunner.query(`DROP TABLE "nest_schema"."seed"`)
    }
}
