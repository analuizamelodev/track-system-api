import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
    @ApiProperty({
        example: "Ana Luiza",
        description: "Nome do usuário",
    })
    @IsString()
    name!: string;

    @ApiProperty({
        example: "ana@email.com",
        description: "E-mail do usuário",
    })
    @IsEmail({}, { message: 'E-mail inválido' })
    email!: string;

    @ApiProperty({
        example: "123456",
        description: "Senha do usuário",
    })
    @IsString()
    @MinLength(6, {
        message: "A senha deve ter no mínimo 6 caracteres",
    })
    password!: string;
}