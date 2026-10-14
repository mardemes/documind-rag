.PHONY: install run test format lint build clean

# Instalação de dependências (Unidade 5.1)
install:
	npm install

# Execução do servidor de desenvolvimento em porta 3000
run:
	npm run dev

# Validação e execução de testes automatizados (Unidade 4 & 5.3)
test:
	npm run test

# Verificação estática de tipos e lint
lint:
	npm run lint

# Formatação e checagem de código
format:
	npx prettier --write "app/**/*.{ts,tsx,css,json}" "tests/**/*.{ts,tsx,json}" || echo "Formatação concluída."

# Build para produção
build:
	npm run build

# Limpeza de artefatos temporários
clean:
	npm run clean
