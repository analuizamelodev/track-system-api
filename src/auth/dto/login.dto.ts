import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail } from "class-validator";

export class LoginDto {
    @ApiProperty({
        example: "admin@example.com",
        description: "E-mail do usuário",
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        example: "admin123",
        description: "Senha do usuário",
    })
    @IsString()
    password!: string;
}