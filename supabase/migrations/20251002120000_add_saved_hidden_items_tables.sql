-- Create saved_items table
CREATE TABLE IF NOT EXISTS saved_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('post', 'comment')),
    item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- Create hidden_items table
CREATE TABLE IF NOT EXISTS hidden_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('post', 'comment')),
    item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_type ON saved_items(item_type);
CREATE INDEX IF NOT EXISTS idx_hidden_items_user_id ON hidden_items(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_items_item_type ON hidden_items(item_type);

-- Enable RLS
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_items
CREATE POLICY "Users can view their own saved items" ON saved_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved items" ON saved_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved items" ON saved_items
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for hidden_items
CREATE POLICY "Users can view their own hidden items" ON hidden_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hidden items" ON hidden_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hidden items" ON hidden_items
    FOR DELETE USING (auth.uid() = user_id);
