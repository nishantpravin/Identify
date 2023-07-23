import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Contact, Email, PhoneNumber, initializeDatabase } from './Contact';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

// Endpoint to handle POST requests to /identify
app.post('/identify', async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;

    try {
        // Initialize the database and create tables if they don't exist
        await initializeDatabase();

        let existingContact = await Contact.findByEmailOrPhoneNumber(email, phoneNumber);

        if (existingContact) {
            // Update contact if new data is present
            if (email && !existingContact.emails.includes(email)) {
                await existingContact.addEmail(email);
            }

            if (phoneNumber && !existingContact.phoneNumbers.includes(phoneNumber)) {
                await existingContact.addPhoneNumber(phoneNumber);
            }
        } else {
            // Create a new contact if not found
            existingContact = new Contact();
            await existingContact.save();

            if (email) {
                await existingContact.addEmail(email);
            }

            if (phoneNumber) {
                await existingContact.addPhoneNumber(phoneNumber);
            }
        }

        // Fetch the secondary contact IDs for existing contacts
        const secondaryContactIds = await Contact.findSecondaryContactIds(existingContact.id);

        res.json({
            contact: {
                primaryContactId: existingContact.id,
                emails: existingContact.emails,
                phoneNumbers: existingContact.phoneNumbers,
                secondaryContactIds,
            },
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
