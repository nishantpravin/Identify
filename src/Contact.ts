import sqlite3 from 'sqlite3';


class Contact {
    id!: number;
    emails: string[] = [];
    phoneNumbers: string[] = [];

    async addEmail(email: string) {
        this.emails.push(email);
        await this.save();
    }

    async addPhoneNumber(phoneNumber: string) {
        this.phoneNumbers.push(phoneNumber);
        await this.save();
    }

    async save() {
        await database.run('UPDATE contacts SET emails = ?, phoneNumbers = ? WHERE id = ?', [
            JSON.stringify(this.emails),
            JSON.stringify(this.phoneNumbers),
            this.id,
        ]);
    }

    static async findByEmailOrPhoneNumber(email?: string, phoneNumber?: string): Promise<Contact | null> {
        if (!email && !phoneNumber) return null;

        const searchField = email ? 'emails' : 'phoneNumbers';
        const searchValue = email || phoneNumber;

        const contactData = await database.get('SELECT * FROM contacts WHERE ? LIKE ?', [searchField, `%${searchValue}%`]);

        if (!contactData) return null;

        const contact = new Contact();
        contact.id = contactData.id;
        contact.emails = JSON.parse(contactData.emails);
        contact.phoneNumbers = JSON.parse(contactData.phoneNumbers);

        return contact;
    }

    static async findSecondaryContactIds(primaryContactId: number): Promise<number[]> {
        const secondaryContactIdsData = await database.all('SELECT contact_id FROM secondary_contacts WHERE primary_contact_id = ?', [
            primaryContactId,
        ]);
        return secondaryContactIdsData.map((data) => data.contact_id);
    }
}
class Email {
    address: string;

    constructor(address: string) {
        this.address = address;
    }
}

class PhoneNumber {
    number: string;

    constructor(number: string) {
        this.number = number;
    }
}

let database: sqlite3.Database | null = null; // Initialize as null

export async function initializeDatabase() {
    if (!database) {
        database = new sqlite3.Database('contacts.db');

        await new Promise<void>((resolve, reject) => {
            database!.exec(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY,
          emails TEXT,
          phoneNumbers TEXT
        )
      `, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        await new Promise<void>((resolve, reject) => {
            database!.exec(`
        CREATE TABLE IF NOT EXISTS secondary_contacts (
          id INTEGER PRIMARY KEY,
          contact_id INTEGER,
          primary_contact_id INTEGER
        )
      `, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
}

export { Contact, Email, PhoneNumber };