const DeletedComment = () => {
  return (
    <div className="py-2">
      <div className="relative rounded-md bg-muted/30 px-3 py-2 select-none">
        <p className="text-sm text-muted-foreground/50 italic blur-[2px]">
          This content has been removed by the user
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground tracking-wide">
            [deleted]
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeletedComment;
