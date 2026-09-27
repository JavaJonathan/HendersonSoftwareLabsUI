import { Accordion, AccordionDetails, AccordionSummary, Container, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const questions = [
  ['What kinds of problems can you help with?', 'We automate repetitive workflows and build internal software and integrations. Examples include recurring reports, document processing, order updates, and bringing information from several tools into one place.'],
  ['Do I need to know what software I want?', 'No. Start with the task that’s slowing you down: how you do it today, which tools you use, and where things get frustrating. We can talk through whether software could help.'],
  ['What should I include in my first message?', 'A short description of the task, how often it happens, and the tools involved is enough to start. You don’t need a technical specification. Please leave out passwords and sensitive customer information.'],
  ['How does discovery work?', 'The initial conversation helps us understand the problem and whether HSL is a good fit. When the workflow needs a closer look, we can propose a scoped paid discovery before quoting implementation.'],
  ['How are projects priced?', 'Each implementation receives a proposal based on an agreed scope. We aim to start with one useful improvement and can split larger work into separately scoped phases.'],
  ['Can you support the software after launch?', 'Yes. An optional ongoing partnership can cover agreed maintenance, support, and improvements. We define the responsibilities and scope together.'],
];

export function Faq() {
  return <Container component="section" maxWidth="md" aria-labelledby="faq-heading" sx={{ py: { xs: 4, md: 6 } }}>
    <Typography id="faq-heading" component="h2" variant="h4" sx={{ mb: 3 }}>Before you get in touch</Typography>
    {questions.map(([question, answer], index) => <Accordion key={question} disableGutters elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
        id={`faq-${index}`}
        aria-controls={`faq-answer-${index}`}
        sx={{ gap: 2, '&.Mui-focusVisible': { bgcolor: 'primary.light', outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}
      ><Typography sx={{ fontWeight: 600 }}>{question}</Typography></AccordionSummary>
      <AccordionDetails><Typography color="text.secondary">{answer}</Typography></AccordionDetails>
    </Accordion>)}
  </Container>;
}
