ALTER TABLE user
ADD COLUMN signer VARCHAR(255);
ALTER TABLE user
ADD CONSTRAINT uc_user_signer UNIQUE (signer);