import { Accordion, AccordionDetails, AccordionSummary, Container, Typography } from '@mui/material';

const questions = [
  ['What kinds of problems can you help with?', 'I build automations, integrations, and internal tools for repetitive business tasks. Examples include keeping data in sync between systems, reducing spreadsheet updates, and bringing information from several tools into one place.'],
  ['Do I need to know what software I want?', 'No. Start with the task that’s slowing you down: how you do it today, which tools you use, and where things get frustrating. We can talk through whether software could help.'],
  ['What should I include in my first message?', 'A short description of the task, how often it happens, and the tools involved is enough to start. You don’t need a technical specification. Please leave out passwords and sensitive customer information.'],
];

export function Faq() {
  return <Container component="section" maxWidth="md" aria-labelledby="faq-heading" sx={{ py: { xs: 4, md: 6 } }}>
    <Typography id="faq-heading" component="h2" variant="h4" sx={{ mb: 3 }}>Before you get in touch</Typography>
    {questions.map(([question, answer], index) => <Accordion key={question} disableGutters elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<span aria-hidden="true">⌄</span>} id={`faq-${index}`} aria-controls={`faq-answer-${index}`}><Typography sx={{ fontWeight: 600 }}>{question}</Typography></AccordionSummary>
      <AccordionDetails><Typography color="text.secondary">{answer}</Typography></AccordionDetails>
    </Accordion>)}
  </Container>;
}
