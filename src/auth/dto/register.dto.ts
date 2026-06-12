import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";
export class RegisterDto {

    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsString()
    password!: string;
}