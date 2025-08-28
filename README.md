# JL – Calendário de Lanche (Café da Manhã)

Sistema inteligente de escala para café da manhã da equipe JL, com rotação automática e trocas manuais.

## 🚀 Funcionalidades

- **📅 Rotação Automática**: Distribuição automática entre os membros da equipe
- **🎯 Dias Úteis**: Funciona apenas em dias úteis (Segunda a Sexta)
- **🏖️ Feriados**: Pula automaticamente feriados nacionais, estaduais (ES) e municipais (Vitória)
- **✏️ Trocas Manuais**: Permite trocar responsáveis por dia específico
- **💾 Persistência**: Salva automaticamente as trocas no navegador
- **🖨️ Impressão**: Layout otimizado para impressão em A4
- **📱 Responsivo**: Interface adaptável para desktop e mobile

## 🛠️ Tecnologias

- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Vite** - Build tool e dev server
- **LocalStorage** - Persistência de dados

## 📦 Instalação e Uso

### Pré-requisitos
- Node.js 16+ 
- pnpm (recomendado) ou npm

### Instalação
```bash
# Clone o repositório
git clone [url-do-repositorio]
cd devloop-breakfast-duty-calendar

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev
```

### Acesso
Abra [http://localhost:5173](http://localhost:5173) no seu navegador.

## 📋 Como Usar

### 1. Configuração Inicial
- **Data de Início**: Define quando a rotação começa (padrão: 25/08/2025)
- **Lista de Pessoas**: Adicione os nomes da equipe (um por linha)

### 2. Visualização do Calendário
- **Meses**: Setembro a Dezembro de 2025
- **Cores**: Cada pessoa tem uma cor única
- **Feriados**: Marcados em amarelo com badge "Feriado"
- **Trocas Manuais**: Indicadas com "(manual)"

### 3. Trocas Manuais
- **Clique** em qualquer dia útil para trocar o responsável
- **Selecione** a pessoa desejada no modal
- **Salve** para aplicar a mudança

### 4. Impressão
- Clique no botão **"Imprimir"** 
- Layout otimizado para A4
- Elementos de interface ocultos automaticamente

### 5. Limpeza de Trocas
- Clique em **"Limpar trocas"** para remover todas as trocas manuais
- Confirmação requerida para evitar perda acidental

## 🗓️ Feriados Considerados (2025)

### Nacionais
- 07/09 - Independência do Brasil
- 12/10 - Nossa Senhora Aparecida  
- 02/11 - Finados
- 15/11 - Proclamação da República
- 20/11 - Dia da Consciência Negra
- 25/12 - Natal

### Estaduais (ES)
- 28/04 - Nossa Senhora da Penha (Padroeira do ES)

### Municipais (Vitória)
- 08/09 - Nossa Senhora da Vitória (Padroeira de Vitória)

## 🧪 Testes

Para executar os testes automatizados:

1. **Localhost**: Os testes rodam automaticamente
2. **URL**: Adicione `?test=1` na URL para forçar execução
3. **Console**: Verifique o console do navegador para resultados

Os testes verificam:
- Cálculo de dias úteis
- Rotação automática
- Detecção de feriados
- Persistência de dados

## 📁 Estrutura do Projeto

```
src/
├── App.tsx          # Componente principal
├── Calendar.tsx     # Lógica do calendário
├── main.tsx         # Ponto de entrada
└── index.css        # Estilos globais
```

## 🔧 Scripts Disponíveis

```bash
pnpm dev      # Servidor de desenvolvimento
pnpm build    # Build para produção
pnpm preview  # Preview do build
```

## 📝 Notas Técnicas

- **Algoritmo de Rotação**: Baseado em dias úteis desde a data de início
- **Persistência**: Dados salvos em `localStorage` com chave `breakfast_overrides_2025`
- **Responsividade**: Grid adaptativo para diferentes tamanhos de tela
- **Acessibilidade**: Suporte a navegação por teclado e leitores de tela

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e de uso interno da equipe JL.

---

**Desenvolvido com ❤️ pela equipe JL**
