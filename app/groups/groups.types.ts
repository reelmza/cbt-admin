type GroupType = {
  _id: string;
  code: string;
  name: string;
  description: string;
  subGroups: { _id: string; name: string }[];
  createdAt: string;
};

type SubGroupType = {
  _id: string;
  code: string;
  name: string;
  description: string;
  group: string;
  createdAt: string;
};
