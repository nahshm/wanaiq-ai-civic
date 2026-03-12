import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z
    .string()
    .min(5, {
      message: "Title must be at least 5 characters.",
    })
    .max(100, {
      message: "Title must not be longer than 100 characters.",
    }),
  content: z
    .string()
    .min(10, {
      message: "Content must be at least 10 characters.",
    })
    .max(5000, {
      message: "Content must not be longer than 5000 characters.",
    }),
  community: z.string({
    required_error: "Please select a community to post to.",
  }),
  isAnonymous: z.boolean().default(false).optional(),
  tags: z.string().optional(),
});

export function CreatePostForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      isAnonymous: false,
      tags: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    form.reset();
    // Here you would typically show a success message or redirect the user
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Post</CardTitle>
        <CardDescription>
          Share what's on your mind with the community. Your voice matters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a descriptive title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A good title helps people find your post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="community"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a community" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* In a real app, this would be fetched from an API */}
                      <SelectItem value="c/General">c/General</SelectItem>
                      <SelectItem value="c/NairobiCounty">
                        c/NairobiCounty
                      </SelectItem>
                      <SelectItem value="c/CorruptionWatch">
                        c/CorruptionWatch
                      </SelectItem>
                      <SelectItem value="c/BudgetWatch">
                        c/BudgetWatch
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the most relevant community for your post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, evidence, or questions here."
                      className="resize-y min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., budget, nairobi, healthcare"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated tags to help categorize your post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Post Anonymously</FormLabel>
                    <FormDescription>
                      If you post anonymously, your username will be hidden.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <CardFooter className="flex justify-end p-0 pt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Submitting..." : "Create Post"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}