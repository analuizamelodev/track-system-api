import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail } from "class-validator";

export class LoginDto {
    @ApiProperty({
        example: "ana@email.com",
        description: "E-mail do usuário",
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        example: "123456",
        description: "Senha do usuário",
    })
    @IsString()
    password!: string;
}